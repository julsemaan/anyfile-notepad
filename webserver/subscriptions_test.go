package main

import (
	"errors"
	"testing"
	"time"

	stripe "github.com/stripe/stripe-go"
)

type fakeSubscriptionIterator struct {
	err           error
	subscriptions []*stripe.Sub
	idx           int
}

func (f *fakeSubscriptionIterator) Next() bool {
	if f.idx >= len(f.subscriptions) {
		return false
	}
	f.idx++
	return true
}

func (f *fakeSubscriptionIterator) Sub() *stripe.Sub {
	if f.idx == 0 || f.idx > len(f.subscriptions) {
		return nil
	}
	return f.subscriptions[f.idx-1]
}

func (f *fakeSubscriptionIterator) Err() error {
	return f.err
}

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

func TestSubscriptionsReload(t *testing.T) {
	originalList := listSubscriptions
	originalSleep := sleepBeforeReloadRetry
	t.Cleanup(func() {
		listSubscriptions = originalList
		sleepBeforeReloadRetry = originalSleep
	})

	t.Run("reload replaces in-memory map with listed subscriptions", func(t *testing.T) {
		s := NewSubscriptions()
		s.SetSubscription(&stripe.Sub{Meta: map[string]string{"user_id": "legacy"}})

		listSubscriptions = func(params *stripe.SubListParams) subscriptionIterator {
			return &fakeSubscriptionIterator{subscriptions: []*stripe.Sub{
				{ID: "sub-1", Meta: map[string]string{"user_id": "u-1"}},
				{ID: "sub-2", Meta: map[string]string{"user_id": "u-2"}},
			}}
		}

		s.Reload()

		if s.GetSubscription("legacy") != nil {
			t.Fatal("expected reload to replace previous subscriptions")
		}
		if got := s.GetSubscription("u-1"); got == nil || got.ID != "sub-1" {
			t.Fatalf("unexpected subscription for u-1: %#v", got)
		}
		if got := s.GetSubscription("u-2"); got == nil || got.ID != "sub-2" {
			t.Fatalf("unexpected subscription for u-2: %#v", got)
		}
	})

	t.Run("reload retries after iterator error", func(t *testing.T) {
		s := NewSubscriptions()
		calls := 0
		slept := false

		listSubscriptions = func(params *stripe.SubListParams) subscriptionIterator {
			calls++
			if calls == 1 {
				return &fakeSubscriptionIterator{err: errors.New("temporary stripe error")}
			}
			return &fakeSubscriptionIterator{subscriptions: []*stripe.Sub{{ID: "sub-retry", Meta: map[string]string{"user_id": "u-retry"}}}}
		}
		sleepBeforeReloadRetry = func(d time.Duration) {
			slept = true
		}

		s.Reload()

		if !slept {
			t.Fatal("expected reload to wait before retry")
		}
		if calls != 2 {
			t.Fatalf("expected 2 list attempts, got %d", calls)
		}
		if s.GetSubscription("u-retry") == nil {
			t.Fatal("expected reload to recover and load subscription")
		}
	})
}

func TestSubscriptionsMaintenance(t *testing.T) {
	originalCancel := cancelSubscription
	t.Cleanup(func() {
		cancelSubscription = originalCancel
	})

	s := NewSubscriptions()
	_ = s.SetSubscription(&stripe.Sub{ID: "sub-active", Status: SubscriptionStatusActive, Meta: map[string]string{"user_id": "u-active"}})
	_ = s.SetSubscription(&stripe.Sub{ID: "sub-past-due", Status: SubscriptionStatusPastDue, Meta: map[string]string{"user_id": "u-past"}})
	_ = s.SetSubscription(&stripe.Sub{ID: "sub-missing", Status: SubscriptionStatusPastDue, Meta: map[string]string{"user_id": "u-missing"}})

	canceled := map[string]bool{}
	cancelSubscription = func(id string, params *stripe.SubParams) (*stripe.Sub, error) {
		canceled[id] = true
		if id == "sub-missing" {
			return nil, &stripe.Error{Code: "resource_missing"}
		}
		return &stripe.Sub{ID: id}, nil
	}

	s.Maintenance()

	if canceled["sub-active"] {
		t.Fatal("did not expect active subscriptions to be canceled")
	}
	if !canceled["sub-past-due"] || !canceled["sub-missing"] {
		t.Fatalf("expected both past_due subscriptions to be canceled, got %#v", canceled)
	}
}
