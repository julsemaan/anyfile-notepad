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

func TestSubscriptionsHelpers(t *testing.T) {
	s := NewSubscriptions()

	if !s.CanHaveAccess(&stripe.Sub{Status: SubscriptionStatusActive}) {
		t.Fatal("expected active subscriptions to have access")
	}
	if !s.CanHaveAccess(&stripe.Sub{Status: SubscriptionStatusPastDue}) {
		t.Fatal("expected past due subscriptions to have access")
	}
	if s.CanHaveAccess(&stripe.Sub{Status: SubscriptionStatusCanceled}) {
		t.Fatal("expected canceled subscriptions to not have access")
	}

	if uid := s.ExtractUserId(&stripe.Sub{ID: "sub-1", Meta: map[string]string{"user_id": "u-1"}}); uid != "u-1" {
		t.Fatalf("unexpected user id: %s", uid)
	}
}

func TestSubscriptionDeleteAndCustomerLookup(t *testing.T) {
	s := NewSubscriptions()
	_ = s.SetSubscription(&stripe.Sub{
		ID:       "sub-1",
		Status:   SubscriptionStatusActive,
		Customer: &stripe.Customer{ID: "cus-1"},
		Meta: map[string]string{
			"user_id": "u-1",
		},
	})
	_ = s.SetSubscription(&stripe.Sub{
		ID:       "sub-2",
		Status:   SubscriptionStatusActive,
		Customer: &stripe.Customer{ID: "cus-2"},
		Meta: map[string]string{
			"user_id": "u-2",
		},
	})

	got := s.GetSubscriptionByCustomer("cus-2")
	if got == nil || got.ID != "sub-2" {
		t.Fatalf("unexpected customer lookup result: %#v", got)
	}

	s.DelSubscription("u-2")
	if s.GetSubscription("u-2") != nil {
		t.Fatal("expected subscription to be removed")
	}
	if s.GetSubscriptionByCustomer("cus-2") != nil {
		t.Fatal("expected customer lookup to return nil after delete")
	}
}
