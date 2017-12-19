package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jcuga/golongpoll"
	stripe "github.com/stripe/stripe-go"
)

var supportEmail = os.Getenv("AFN_SUPPORT_EMAIL")

var subscriptions = NewSubscriptions()
var apiRegexp = regexp.MustCompile(`^/api`)

var apiHandler http.Handler
var appProdHandler http.Handler
var appDevHandler http.Handler
var eventsManager *golongpoll.LongpollManager
var eventsHandler func(http.ResponseWriter, *http.Request)

var aliasPaths = map[string]string{
	"/app": "/app.html",
	// Catch people who would try to get to the template directly
	"/app-plus-plus.html": "/app.html",
	"/news":               "/site/news.html",
	"/news.html":          "/site/news.html",
	"/faq":                "/site/faq.html",
	"/faq.html":           "/site/faq.html",
	"/help-translate":     "/site/help_translate.html",
}

func main() {
	setup()
	fmt.Println(http.ListenAndServe(":8000", Handler{}))
}

func setup() {
	prodAppPath := flag.String("prod-app-path", os.Getenv("AFN_PROD_APP_PATH"), "path to the production application files")
	devAppPath := flag.String("dev-app-path", os.Getenv("AFN_DEV_APP_PATH"), "path to the production application files")
	flag.Parse()

	stripe.Key = os.Getenv("STRIPE_SK")

	// Reload once synchronously, then start an hourly job to do it
	subscriptions.Reload()
	go func() {
		for {
			subscriptions.Reload()
			time.Sleep(1 * time.Hour)
		}
	}()

	r := gin.Default()
	api := r.Group("/api")

	subscription := api.Group("/billing/subscription")
	subscription.Use(LoadSubscription)
	subscription.Use(LoadGoogleUser)
	subscription.POST("/", upgrade)
	subscription.POST("/:user_id/cancel", cancel)
	subscription.POST("/:user_id/resume", resume)
	subscription.GET("/:user_id", getSubscription)

	apiHandler = r

	fmt.Println("Serving production application from", *prodAppPath)
	appProdHandler = http.FileServer(http.Dir(*prodAppPath))

	fmt.Println("Serving development application from", *devAppPath)
	appDevHandler = http.FileServer(http.Dir(*devAppPath))

	var err error
	eventsManager, err = golongpoll.StartLongpoll(golongpoll.Options{
		LoggingEnabled: true,
	})
	if err != nil {
		fmt.Println("Failed to create manager: %q", err)
	}
	eventsHandler = eventsManager.SubscriptionHandler

	go func() {
		clusterObserver := NewClusterObserver(strings.Split(os.Getenv("AFN_WEBSERVER_PEERS"), ","))
		clusterObserver.Start()
	}()
}
