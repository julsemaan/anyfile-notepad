package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/davecgh/go-spew/spew"
	"github.com/gin-gonic/gin"
	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
	"github.com/stripe/stripe-go/sub"
)

func LoadSubscription(c *gin.Context) {
	if userId := c.Param("user_id"); userId != "" {
		if subscription := subscriptions.GetSubscription(userId); subscription == nil {
			fmt.Println("Failed to find subscription for", userId)
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
			fmt.Println("ERROR getting Google user", resp.StatusCode, string(respBody))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Unable to find a Google user account with the provided authentication token."})
		} else {
			user := GoogleUser{}
			dec := json.NewDecoder(resp.Body)
			err := dec.Decode(&user)

			if err != nil {
				fmt.Println("ERROR while decoding response body to get Google user", err)
			}

			if userId != user.Id {
				fmt.Println("Halting in Google user validation")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "The subscription you are trying to modify isn't attached to the user you are currently logged in with."})
			} else {
				fmt.Println("Passed through Google user validation")
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

func getSubscription(c *gin.Context) {
	c.JSON(http.StatusOK, c.Value("subscription"))
}

func resume(c *gin.Context) {
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
		fmt.Println("ERROR while resuming subscription for", userId, spew.Sdump(err))
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to resume the subscription. Please try again or contact " + supportEmail})
	} else {
		spew.Dump(updatedSub)
		fmt.Println("Resumed subscription for", userId)
		subscriptions.SetSubscription(updatedSub)
		eventsManager.Publish("reload", "now")

		c.JSON(http.StatusOK, gin.H{
			"message": "Subscription resumed for this user.",
		})
	}
}

func cancel(c *gin.Context) {
	userId := c.Param("user_id")

	subscription := c.Value("subscription").(*stripe.Sub)
	if subscription.EndCancel {
		willEnd := time.Unix(0, subscription.PeriodEnd*int64(time.Second))
		c.JSON(http.StatusBadRequest, gin.H{
			"message": fmt.Sprintf("This subscription has already been canceled, it will end on %s. Until then, you can continue using the ad-free version of the app.", willEnd),
		})
		return
	}

	updatedSub, err := sub.Cancel(subscription.ID, &stripe.SubParams{EndCancel: true})
	if err != nil {
		fmt.Println("ERROR while canceling subscription for", userId, spew.Sdump(err))
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to cancel the subscription. Please try again or contact " + supportEmail})
	} else {
		spew.Dump(updatedSub)
		fmt.Println("Canceled subscription for", userId)
		subscriptions.SetSubscription(updatedSub)
		eventsManager.Publish("reload", "now")

		c.JSON(http.StatusOK, gin.H{
			"message": fmt.Sprintf("Subscription canceled for this user. Will stay valid until %s", time.Unix(0, updatedSub.PeriodEnd*int64(time.Second))),
		})
	}
}

func upgrade(c *gin.Context) {
	var form Upgrade
	if err := c.Bind(&form); err == nil {
		fmt.Println("Received form", spew.Sdump(form))

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
		eventsManager.Publish("reload", "now")

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
