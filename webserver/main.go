package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	stripe "github.com/stripe/stripe-go"
)

var supportEmail = os.Getenv("AFN_SUPPORT_EMAIL")

var subscriptions = NewSubscriptions()
var apiRegexp = regexp.MustCompile(`^/api`)

var apiHandler http.Handler
var appProdHandler http.Handler
var appDevHandler http.Handler

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
	prodAppPath := flag.String("prod-app-path", "/tmp", "path to the production application files")
	devAppPath := flag.String("dev-app-path", "/tmp", "path to the production application files")
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
	subscription.POST("/", upgrade)
	subscription.POST("/:user_id/cancel", cancel)
	subscription.POST("/:user_id/resume", resume)
	subscription.GET("/:user_id", getSubscription)
	apiHandler = r

	fmt.Println("Serving production application from", *prodAppPath)
	appProdHandler = http.FileServer(http.Dir(*prodAppPath))

	fmt.Println("Serving development application from", *devAppPath)
	appDevHandler = http.FileServer(http.Dir(*devAppPath))

	fmt.Println(http.ListenAndServe(":8000", Handler{}))
}

type Handler struct{}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if apiRegexp.MatchString(r.URL.Path) {
		apiHandler.ServeHTTP(w, r)
	} else {
		h.ServeStaticApplication(w, r)
	}
}

func (h Handler) ServeStaticApplication(w http.ResponseWriter, r *http.Request) {
	// Handle alias if applicable
	if alias, ok := aliasPaths[r.URL.Path]; ok {
		r.URL.Path = alias
	}

	// Present app without ads if applicable and ensure no caching headers are set for this resource
	if r.URL.Path == "/app.html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		if userIdCookie, err := r.Cookie("current_google_user_id"); err == nil {
			userId := userIdCookie.Value
			if subscription := subscriptions.GetSubscription(userId); subscription != nil {
				if subscription.Status != "active" {
					fmt.Println(userId, "subscription isn't active anymore")
				} else {
					fmt.Println(userId, "allowing access to ++ app")
					r.URL.Path = "/app-plus-plus.html"
				}
			}
		}
	}

	// Check if we should send to prod or dev backend
	var appHandler http.Handler = appProdHandler
	if devCookie, err := r.Cookie("AFNVersion"); err == nil && devCookie.Value == "dev" {
		appHandler = appDevHandler
	}

	appHandler.ServeHTTP(w, r)
}
