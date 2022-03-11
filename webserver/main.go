package main

import (
	"flag"
	"net/http"
	_ "net/http/pprof"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/inverse-inc/packetfence/go/sharedutils"
	"github.com/jcuga/golongpoll"
	stripe "github.com/stripe/stripe-go"
)

var supportEmail = os.Getenv("AFN_SUPPORT_EMAIL")
var appBaseURL = EnvOrDefault("APP_BASE_URL", "https://anyfile-notepad.semaan.ca")

var subscriptions = NewSubscriptions()
var apiRegexp = regexp.MustCompile(`^/api`)

var apiHandler http.Handler
var appProdHandler http.Handler
var appDevHandler http.Handler
var eventsManager *golongpoll.LongpollManager
var eventsHandler func(http.ResponseWriter, *http.Request)
var realtimeManager *golongpoll.LongpollManager
var realtimeHandler func(http.ResponseWriter, *http.Request)

var plusPlusSessionsDb = os.Getenv("PLUS_PLUS_SESSIONS_DB")
var plusPlusSessions = NewPlusPlusSessions()
var longPollLogging = (sharedutils.EnvOrDefault("LONG_POLL_LOGGING", "false") == "true")
var blockedUsers = strings.Split(sharedutils.EnvOrDefault("BLOCKED_USER_IDS", ""), ",")
var blockedUsersMap = map[string]bool{}

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

	go func() {
		InfoPrint(http.ListenAndServe("localhost:6061", nil))
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	InfoPrint(http.ListenAndServe(":"+port, Handler{}))
}

func setupSessionsPersistence() {
	if plusPlusSessionsDb != "" {
		InfoPrint("Using sessions DB:", plusPlusSessionsDb)

		err := plusPlusSessions.RestoreFromFile(plusPlusSessionsDb)
		if err != nil {
			ErrPrint("Failed to restore the sessions from file", plusPlusSessionsDb, "due to error", err)
		}

		go func() {
			for {
				time.Sleep(5 * time.Second)
				InfoPrint("Maintenance + saving the sessions")
				plusPlusSessions.Maintenance()
				err := plusPlusSessions.SaveToFile(plusPlusSessionsDb)
				if err != nil {
					ErrPrint("Failed to save the sessions", err)
				}
			}
		}()
	}

}

func setupHandlers() {
	prodAppPath := flag.String("prod-app-path", os.Getenv("AFN_PROD_APP_PATH"), "path to the production application files")
	devAppPath := flag.String("dev-app-path", os.Getenv("AFN_DEV_APP_PATH"), "path to the production application files")
	flag.Parse()

	r := gin.Default()
	api := r.Group("/api")

	collab := api.Group("/collaboration")
	collab.POST("/realtime_events/:category", publishRealtimeEvent)

	subscription := api.Group("/billing/subscription")
	subscription.Use(LoadSubscription)
	subscription.Use(LoadGoogleUser)
	subscription.POST("/", handleSubscriptionUpgrade)
	subscription.POST("/:user_id/cancel", handleSubscriptionCancel)
	subscription.POST("/:user_id/resume", handleSubscriptionResume)
	subscription.GET("/:user_id", handleSubscriptionRead)

	api.POST("/billing/link_cancel/:cus_id/:cancel_link_id", handleLinkCancel)

	api.POST("/billing/stripe-hook", handleStripeHook)

	apiHandler = r

	InfoPrint("Serving production application from", *prodAppPath)
	appProdHandler = http.FileServer(http.Dir(*prodAppPath))

	InfoPrint("Serving development application from", *devAppPath)
	appDevHandler = http.FileServer(http.Dir(*devAppPath))

	var err error
	eventsManager, err = golongpoll.StartLongpoll(golongpoll.Options{
		LoggingEnabled: longPollLogging,
	})
	if err != nil {
		InfoPrint("Failed to create manager: %q", err)
	}
	eventsHandler = eventsManager.SubscriptionHandler

	realtimeManager, err = golongpoll.StartLongpoll(golongpoll.Options{
		LoggingEnabled:     longPollLogging,
		MaxEventBufferSize: 1000,
		// Events stay for up to 1 hour
		EventTimeToLiveSeconds: 3600,
	})
	if err != nil {
		ErrPrint("Failed to create manager: %q", err)
	}
	realtimeHandler = realtimeManager.SubscriptionHandler
}

func setupSubscriptions() {
	subscriptions.Reload()
	todo := func() {
		subscriptions.Maintenance()
		subscriptions.Reload()
	}

	// Maintenance + reload once synchronously, then start an hourly job to do it
	todo()

	go func() {
		for {
			time.Sleep(1 * time.Hour)
			todo()
		}
	}()
}

func setupClusterObserver() {
	go func() {
		peers := os.Getenv("AFN_WEBSERVER_PEERS")
		if peers == "" {
			InfoPrint("No peers configured, not setting up clustering")
		} else {
			InfoPrint("Will connect to the following peers", peers)
			clusterObserver := NewClusterObserver(strings.Split(peers, ","))
			clusterObserver.Start()
		}
	}()
}

func setupBlockedUsersMap() {
	for _, uid := range blockedUsers {
		blockedUsersMap[uid] = true
	}
}

func setup() {
	setupBlockedUsersMap()

	setupSessionsPersistence()

	stripe.Key = os.Getenv("STRIPE_SK")

	setupHandlers()

	setupSubscriptions()

	setupClusterObserver()
}
