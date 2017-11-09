package main

import (
	"testing"

	stripe "github.com/stripe/stripe-go"
)

func TestSubscriptions(t *testing.T) {
	s := NewSubscriptions()

	if len(s.data) != 0 {
		t.Error("wrong length for subscriptions")
	}

	if s.GetSubscription(testUserId) != nil {
		t.Error("Was able to get a subscription when it shouldn't have existed")
	}

	err := s.SetSubscription(&stripe.Sub{
		Status: "active",
		Meta: map[string]string{
			"user_id": testUserId,
		},
	})

	if err != nil {
		t.Error("Saving an invalid subscription shouldn't have given an error but it did")
	}

	if len(s.data) != 1 {
		t.Error("wrong length for subscriptions")
	}

	// Setting the subscription for the same user should result in the user entry being updated
	err = s.SetSubscription(&stripe.Sub{
		Status: "different",
		Meta: map[string]string{
			"user_id": testUserId,
		},
	})

	if err != nil {
		t.Error("Saving an invalid subscription shouldn't have given an error but it did")
	}

	if len(s.data) != 1 {
		t.Error("wrong length for subscriptions")
	}

	if s.GetSubscription(testUserId).Status != "different" {
		t.Error("A subscription that was set for a user cannot be retreived")
	}

	// Setting a subscription without user ID metadata shouldn't work
	err = s.SetSubscription(&stripe.Sub{
		Status: "active",
	})

	if err == nil {
		t.Error("Saving an invalid subscription should have given an error but it didn't")
	}

	if len(s.data) != 1 {
		t.Error("wrong length for subscriptions")
	}

	// Test emptying
	s.Empty()

	if len(s.data) != 0 {
		t.Error("Emptying subscriptions didn't empty the data")
	}
}
