package main

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/davecgh/go-spew/spew"
	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/sub"
)

type Subscriptions struct {
	data map[string]*stripe.Sub
	lock *sync.RWMutex
}

func NewSubscriptions() *Subscriptions {
	return &Subscriptions{
		data: map[string]*stripe.Sub{},
		lock: &sync.RWMutex{},
	}
}

func (s *Subscriptions) Empty() {
	s.data = map[string]*stripe.Sub{}
}

func (s *Subscriptions) CanHaveAccess(subscription *stripe.Sub) bool {
	return subscription.Status == "active" || subscription.Status == "past_due"
}

func (s *Subscriptions) ExtractUserId(subscription *stripe.Sub) string {
	userId := subscription.Meta["user_id"]
	if userId == "" {
		ErrPrint("can't extract user ID out of subscription", subscription.ID)
	}
	return userId
}

func (s *Subscriptions) SetSubscription(subscription *stripe.Sub) error {
	s.lock.Lock()
	defer s.lock.Unlock()

	InfoPrint("Setting subscription", subscription.ID)

	if userId := subscription.Meta["user_id"]; userId == "" {
		return errors.New("Invalid user_id field in the metadata")
	} else {
		s.data[subscription.Meta["user_id"]] = subscription
		return nil
	}
}

func (s *Subscriptions) DelSubscription(userId string) {
	s.lock.Lock()
	defer s.lock.Unlock()

	delete(s.data, userId)
}

func (s *Subscriptions) GetSubscription(userId string) *stripe.Sub {
	s.lock.Lock()
	defer s.lock.Unlock()

	return s.data[userId]
}

func (s *Subscriptions) GetSubscriptionByCustomer(cusId string) *stripe.Sub {
	s.lock.Lock()
	defer s.lock.Unlock()

	for _, s := range s.data {
		if s.Customer.ID == cusId {
			return s
		}
	}

	return nil
}

func (s *Subscriptions) Reload() {
	params := &stripe.SubListParams{}
	params.Filters.AddFilter("limit", "", "100")
	i := sub.List(params)

	if i.Err() != nil {
		ErrPrint("Unable to reload subscriptions, retrying in 10 seconds")
		time.Sleep(10 * time.Second)
		s.Reload()
		return
	}

	newdata := map[string]*stripe.Sub{}
	count := 0
	for i.Next() {
		count += 1
		subscription := i.Sub()
		InfoPrint("Updating subscription", subscription.ID)
		newdata[s.ExtractUserId(subscription)] = subscription
	}

	fmt.Printf("Reloaded %d subscriptions \n", count)

	s.lock.Lock()
	defer s.lock.Unlock()
	s.data = newdata
}

func (s *Subscriptions) Maintenance() {
	s.lock.Lock()
	defer s.lock.Unlock()
	for _, asub := range s.data {
		if asub.Status == "past_due" {
			InfoPrint("Canceling past due subscription", asub.ID)
			_, err := sub.Cancel(asub.ID, &stripe.SubParams{EndCancel: false})
			serr, isStripeErr := err.(*stripe.Error)
			if isStripeErr && serr.Code == "resource_missing" {
				ErrPrint("Unable to cancel subscription as it was already canceled", asub.ID)
			} else if err != nil {
				ErrPrint("Unable to cancel subscription", asub.ID, err)
				spew.Dump(err)
			}
		}
	}
}
