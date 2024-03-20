package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"text/template"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/gin-gonic/gin"
	"github.com/inverse-inc/packetfence/go/sharedutils"
	"github.com/julsemaan/anyfile-notepad/utils"
	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/sub"
	"github.com/stripe/stripe-go/webhook"
)

func LoadSubscription(c *gin.Context) {
	if userId := c.Param("user_id"); userId != "" {
		if subscription := subscriptions.GetSubscription(userId); subscription == nil {
			InfoPrint("Failed to find subscription for", userId)
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"message": "Cannot find subscription for this user."})
		} else {
			c.Set("subscription", subscription)
		}

	}

	c.Next()
}

type GoogleUser struct {
	Id    string
	Email string
}

func LoadGoogleUser(c *gin.Context) {
	if userId := c.Param("user_id"); userId != "" {
		req, _ := http.NewRequest("GET", "https://content.googleapis.com/oauth2/v2/userinfo", nil)
		if accessToken, err := c.Request.Cookie("access_token"); err == nil {
			req.Header.Add("Authorization", "Bearer "+accessToken.Value)
		}
		resp, err := http.DefaultClient.Do(req)
		if resp.StatusCode != http.StatusOK || err != nil {
			respBody, _ := ioutil.ReadAll(resp.Body)
			ErrPrint("Failed getting Google user", resp.StatusCode, string(respBody))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Unable to find a Google user account with the provided authentication token."})
		} else {
			user := GoogleUser{}
			dec := json.NewDecoder(resp.Body)
			err := dec.Decode(&user)

			if err != nil {
				ErrPrint("Failed decoding response body to get Google user", err)
			}

			if userId != user.Id {
				InfoPrint("Halting in Google user validation")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "The subscription you are trying to modify isn't attached to the user you are currently logged in with."})
			} else {
				InfoPrint("Passed through Google user validation")
				c.Set("google_user", &user)
			}
		}
	}

	c.Next()
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

func handleSubscriptionRead(c *gin.Context) {
	c.JSON(http.StatusOK, c.Value("subscription"))
}

func handleSubscriptionResume(c *gin.Context) {
	userId := c.Param("user_id")

	subscription := c.Value("subscription").(*stripe.Sub)
	if !subscription.EndCancel {
		willEnd := time.Unix(0, subscription.PeriodEnd*int64(time.Second))
		c.JSON(http.StatusBadRequest, gin.H{
			"message": fmt.Sprintf("This subscription is not currently canceled", willEnd),
		})
		return
	}

	updatedSub, err := sub.Update(subscription.ID, &stripe.SubParams{EndCancel: false})
	if err != nil {
		ErrPrint("Failed resuming subscription for", userId, spew.Sdump(err))
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to resume the subscription. Please try again or contact " + supportEmail})
	} else {
		spew.Dump(updatedSub)
		InfoPrint("Resumed subscription for", userId)
		subscriptions.SetSubscription(updatedSub)
		eventsManager.Publish("reload", "now")

		c.JSON(http.StatusOK, gin.H{
			"message": "Subscription resumed for this user.",
		})
	}
}

func handleSubscriptionCancel(c *gin.Context) {
	subscription := c.Value("subscription").(*stripe.Sub)

	userId := subscription.Meta["user_id"]

	if subscription.EndCancel {
		willEnd := time.Unix(0, subscription.PeriodEnd*int64(time.Second))
		c.JSON(http.StatusBadRequest, gin.H{
			"message": fmt.Sprintf("This subscription has already been canceled, it will end on %s. Until then, you can continue using the ad-free version of the app.", willEnd),
		})
		return
	}

	updatedSub, err := sub.Cancel(subscription.ID, &stripe.SubParams{EndCancel: true})
	if err != nil {
		ErrPrint("Failed canceling subscription for", userId, spew.Sdump(err))
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to cancel the subscription. Please try again or contact " + supportEmail})
	} else {
		spew.Dump(updatedSub)
		InfoPrint("Canceled subscription for", userId)
		subscriptions.SetSubscription(updatedSub)
		eventsManager.Publish("reload", "now")

		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Subscription canceled for this user. Will stay valid until %s", time.Unix(0, updatedSub.PeriodEnd*int64(time.Second))),
		})
	}
}

func handleSubscriptionUpgrade(c *gin.Context) {
	var form Upgrade
	if err := c.Bind(&form); err == nil {
		InfoPrint("Received form", spew.Sdump(form))

		customerParams := &stripe.CustomerParams{
			Desc:  "Customer for Google email: " + form.UserEmail,
			Email: form.StripeEmail,
		}
		customerParams.SetSource(form.StripeToken)
		customerParams.AddMeta("google_email", form.UserEmail)

		customer, err := customer.New(customerParams)

		if err != nil {
			upgradeError(c, err, form.FailureUrl)
			return
		}

		InfoPrint("Created customer", spew.Sdump(customer))
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

		InfoPrint("Created subscription", spew.Sdump(subscription))

		subscriptions.SetSubscription(subscription)
		eventsManager.Publish("reload", "now")

		c.Redirect(http.StatusFound, form.SuccessUrl)
	} else {
		upgradeError(c, err, "")
		return
	}

}

func upgradeError(c *gin.Context, err error, failureUrl string) {
	// If we're here then we failed, so its not good....
	InfoPrint("Failed to process Stripe subscription")
	spew.Dump(err)
	c.Redirect(http.StatusFound, failureUrl)
}

func handleLinkCancel(c *gin.Context) {
	cus, err := customer.Get(c.Param("cus_id"), nil)
	if err != nil {
		ErrPrint("Unable to retreive customer", c.Param("cus_id"))
		c.JSON(http.StatusNotFound, gin.H{"message": "Unable to retreive customer information"})
		return
	}

	if cus.Meta["cancel_link_id"] == "" || c.Param("cancel_link_id") == "" {
		ErrPrint("Trying to do a link cancel but the cancel_link_id is empty")
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": "Missing information to use the link cancelation."})
		return
	}

	if cus.Meta["cancel_link_id"] != c.Param("cancel_link_id") {
		ErrPrint("Unable to validate the cancel link ID while doing a link cancelation. Either this is broken, someone used an outdated link or someone is trying to brute force the endpoint.", c.Param("cus_id"))
		c.JSON(http.StatusNotFound, gin.H{"message": "Unable to validate information"})
		return
	}

	s := subscriptions.GetSubscriptionByCustomer(cus.ID)
	if s == nil {
		ErrPrint("Unable to find a subscription for this customer ID", c.Param("cus_id"))
		c.JSON(http.StatusNotFound, gin.H{"message": "Unable to retreive subscription"})
		return
	}

	c.Set("subscription", s)
	handleSubscriptionCancel(c)

	if c.Writer.Status() == http.StatusOK {
		msgTemplate, _ := template.New("cancelation-notification").Parse(`Subject: A subscription has been canceled through a renewal email
To: {{.Emails}}
Customer {{.CustomerEmail}} has just canceled his Anyfile Notepad subscription through an email link.

Cheers!
`)

		var msgBytes bytes.Buffer
		msgTemplate.Execute(&msgBytes, struct {
			Emails        string
			CustomerEmail string
		}{
			Emails:        supportEmail,
			CustomerEmail: cus.Email,
		})
		msg, _ := ioutil.ReadAll(&msgBytes)
		utils.SendEmail([]string{supportEmail}, msg)
	}
}

func handleStripeHook(c *gin.Context) {
	d, _ := c.GetRawData()

	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	e, err := webhook.ConstructEvent(d, c.Request.Header.Get("Stripe-Signature"),
		endpointSecret)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid signature"})
		return
	}

	InfoPrint(string(d))

	if e.Type != "invoice.upcoming" {
		ErrPrint("Unsupported event type", e.Type)
		c.JSON(http.StatusInternalServerError, gin.H{})
		return
	}

	obj := struct {
		Customer      string
		CustomerEmail string `json:"customer_email"`
	}{}
	json.Unmarshal(e.Data.Raw, &obj)

	var googleEmail string
	var customerEmail string

	if obj.Customer == "cus_00000000000000" {
		obj.Customer = os.Getenv("STRIPE_INVOICE_UPCOMING_WEBHOOK_TEST_CUSTOMER_ID")
	}

	cus, err := customer.Get(obj.Customer, nil)

	if err != nil {
		ErrPrint("Unable to get customer", obj.Customer, err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	googleEmail = cus.Meta["google_email"]
	customerEmail = cus.Email

	cancelLinkId := secureRandomString(16)
	if cus.Meta["cancel_link_id"] == "" {
		params := &stripe.CustomerParams{}
		params.AddMeta("cancel_link_id", cancelLinkId)

		_, err = customer.Update(cus.ID, params)
		if err != nil {
			ErrPrint("Unable to update cancel link ID for", cus.ID)
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
	} else {
		cancelLinkId = cus.Meta["cancel_link_id"]
	}

	emails := []string{}
	if googleEmail != "" {
		emails = append(emails, googleEmail)
	}
	if customerEmail != "" {
		emails = append(emails, customerEmail)
	}

	if sharedutils.IsEnabled(sharedutils.EnvOrDefault("COPY_RENEWAL_TO_SUPPORT_EMAIL", "disabled")) {
		if supportEmail != "" {
			emails = append(emails, supportEmail)
		}
	}

	InfoPrint("Sending renewal notification email to", emails)

	msgTemplate, _ := template.New("renewal-email").Parse(`Subject: Your Anyfile Notepad subscription is about to renew
To: {{.Emails}}
Greetings from Anyfile Notepad,

Your $3.99 yearly subscription to the application {{.BaseURL}} will automatically renew in less than 30 days.

The subscription was registered with the following Google account: {{.GoogleEmail}} 

If you do not wish to stay subscribed to the application, click the following link:
{{.BaseURL}}/site/email-cancel.html?cus_id={{.CustomerID}}&cancel_link_id={{.CancelLinkID}}

You can also reply to this email to request the cancelation of your subscription.

In the event your credit card cannot be billed your subscription will be automatically cancelled. You can then subscribe again inside the app.

Cheers!

The Anyfile Notepad team
`)

	var msgBytes bytes.Buffer
	msgTemplate.Execute(&msgBytes, struct {
		GoogleEmail  string
		Emails       string
		CustomerID   string
		CancelLinkID string
		BaseURL      string
	}{
		GoogleEmail:  googleEmail,
		Emails:       strings.Join(emails, ";"),
		CustomerID:   cus.ID,
		CancelLinkID: cancelLinkId,
		BaseURL:      appBaseURL,
	})
	msg, _ := ioutil.ReadAll(&msgBytes)
	err = utils.SendEmail(emails, msg)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{})
	} else {
		c.JSON(http.StatusOK, gin.H{})
	}
}
