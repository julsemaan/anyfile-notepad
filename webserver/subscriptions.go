package main

import (
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

func (s *Subscriptions) SetSubscription(subscription *stripe.Sub) {
	s.lock.Lock()
	defer s.lock.Unlock()
	fmt.Println("Setting subscription", subscription.ID)
	s.data[subscription.Meta["user_id"]] = subscription
}

func (s *Subscriptions) GetSubscription(userId string) *stripe.Sub {
	return s.data[userId]
}

func (s *Subscriptions) Reload() {
	params := &stripe.SubListParams{}
	params.Filters.AddFilter("limit", "", "100")
	i := sub.List(params)
	for i.Next() {
		subscription := i.Sub()
		s.SetSubscription(subscription)
	}
}
