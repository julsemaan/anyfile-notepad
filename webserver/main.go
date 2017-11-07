package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/gin-gonic/gin"
	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/sub"
)

var subscriptions = NewSubscriptions()
var billingRegexp = regexp.MustCompile(`^/billing`)

var billingHandler http.Handler
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
	r.POST("/billing/upgrade", upgrade)
	billingHandler = r

	fmt.Println("Serving production application from", *prodAppPath)
	appProdHandler = http.FileServer(http.Dir(*prodAppPath))

	fmt.Println("Serving development application from", *devAppPath)
	appDevHandler = http.FileServer(http.Dir(*devAppPath))

	fmt.Println(http.ListenAndServe(":8000", Handler{}))
}

type Handler struct{}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if billingRegexp.MatchString(r.URL.Path) {
		billingHandler.ServeHTTP(w, r)
	} else {
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
}

type Upgrade struct {
	UserId          string `form:"user_id"`
	UserEmail       string `form:"user_email"`
	SuccessUrl      string `form:"success_url"`
	FailureUrl      string `form:"failure_url"`
	StripeToken     string `form:"stripeToken"`
	StripeTokenType string `form:"stripeTokenType"`
	StripeEmail     string `form:"stripeEmail"`
}

func upgrade(c *gin.Context) {
	var form Upgrade
	if err := c.Bind(&form); err == nil {
		fmt.Println("Received form", spew.Sdump(form))

		customerParams := &stripe.CustomerParams{
			Desc: "Customer for Google email: " + form.UserEmail,
		}
		customerParams.SetSource(form.StripeToken)

		customer, err := customer.New(customerParams)

		if err != nil {
			upgradeError(c, err, form.FailureUrl)
			return
		}

		fmt.Println("Created customer", spew.Sdump(customer))
		subParams := &stripe.SubParams{
			Customer: customer.ID,
			Items: []*stripe.SubItemsParams{
				{
					Plan: os.Getenv("STRIPE_PP_PLAN"),
				},
			},
		}
		subParams.AddMeta("user_id", form.UserId)
		subscription, err := sub.New(subParams)

		if err != nil {
			upgradeError(c, err, form.FailureUrl)
			return
		}

		fmt.Println("Created subscription", spew.Sdump(subscription))

		subscriptions.SetSubscription(subscription)

		c.Redirect(http.StatusFound, form.SuccessUrl)
	} else {
		upgradeError(c, err, "")
		return
	}

}

func upgradeError(c *gin.Context, err error, failureUrl string) {
	// If we're here then we failed, so its not good....
	fmt.Println("Failed to process Stripe subscription")
	spew.Dump(err)
	c.Redirect(http.StatusFound, failureUrl)
}
