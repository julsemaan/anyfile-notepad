package main

import (
	"errors"
	"fmt"
	"sync"

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

func (s *Subscriptions) SetSubscription(subscription *stripe.Sub) error {
	s.lock.Lock()
	defer s.lock.Unlock()

	fmt.Println("Setting subscription", subscription.ID)

	if userId := subscription.Meta["user_id"]; userId == "" {
		return errors.New("Invalid user_id field in the metadata")
	} else {
		if subscription.Status == "active" {
			s.data[subscription.Meta["user_id"]] = subscription
		} else {
			fmt.Println("Ignoring non-active subscription", subscription.ID)
		}
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

func (s *Subscriptions) Reload() {
	params := &stripe.SubListParams{}
	params.Filters.AddFilter("limit", "", "100")
	i := sub.List(params)
	for i.Next() {
		subscription := i.Sub()
		s.DelSubscription(subscription.Meta["user_id"])
		s.SetSubscription(subscription)
	}
}
