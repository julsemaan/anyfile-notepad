package main

import (
	"errors"
	"testing"

	stripe "github.com/stripe/stripe-go"
)

type fakeCustomerIterator struct {
	err       error
	customers []*stripe.Customer
	idx       int
}

func (f *fakeCustomerIterator) Next() bool {
	if f.idx >= len(f.customers) {
		return false
	}
	f.idx++
	return true
}

func (f *fakeCustomerIterator) Customer() *stripe.Customer {
	if f.idx == 0 || f.idx > len(f.customers) {
		return nil
	}
	return f.customers[f.idx-1]
}

func (f *fakeCustomerIterator) Err() error {
	return f.err
}

func TestEmailExtractionRegex(t *testing.T) {
	match := reEmailFromDesc.FindAllStringSubmatch("Customer for Google email: user@example.com", -1)
	if len(match) != 1 || len(match[0]) < 2 {
		t.Fatalf("expected one regex match, got %#v", match)
	}
	if match[0][1] != "user@example.com" {
		t.Fatalf("unexpected extracted email: %s", match[0][1])
	}

	none := reEmailFromDesc.FindAllStringSubmatch("No email here", -1)
	if len(none) != 0 {
		t.Fatalf("expected no match, got %#v", none)
	}
}

func TestUpdateCustomerEmails(t *testing.T) {
	originalList := listCustomers
	originalUpdate := updateCustomer
	t.Cleanup(func() {
		listCustomers = originalList
		updateCustomer = originalUpdate
	})

	t.Run("updates only customers missing google_email metadata", func(t *testing.T) {
		updated := map[string]string{}
		listCustomers = func(params *stripe.CustomerListParams) customerIterator {
			return &fakeCustomerIterator{customers: []*stripe.Customer{
				{ID: "cus-1", Desc: "Customer for Google email: first@example.com", Meta: map[string]string{}},
				{ID: "cus-2", Desc: "already has metadata", Meta: map[string]string{"google_email": "present@example.com"}},
			}}
		}
		updateCustomer = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			updated[id] = "updated"
			return &stripe.Customer{ID: id}, nil
		}

		updateCustomerEmails()

		if len(updated) != 1 {
			t.Fatalf("expected one customer update, got %#v", updated)
		}
		if updated["cus-1"] != "updated" {
			t.Fatalf("unexpected metadata update payload: %#v", updated)
		}
	})

	t.Run("panics when listing customers fails", func(t *testing.T) {
		listCustomers = func(params *stripe.CustomerListParams) customerIterator {
			return &fakeCustomerIterator{err: errors.New("list failed")}
		}

		defer func() {
			if recover() == nil {
				t.Fatal("expected panic on list failure")
			}
		}()

		updateCustomerEmails()
	})

	t.Run("panics when description does not contain a recoverable email", func(t *testing.T) {
		listCustomers = func(params *stripe.CustomerListParams) customerIterator {
			return &fakeCustomerIterator{customers: []*stripe.Customer{
				{ID: "cus-3", Desc: "invalid description", Meta: map[string]string{}},
			}}
		}
		updateCustomer = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id}, nil
		}

		defer func() {
			if recover() == nil {
				t.Fatal("expected panic on invalid description")
			}
		}()

		updateCustomerEmails()
	})

	t.Run("panics when stripe update fails", func(t *testing.T) {
		listCustomers = func(params *stripe.CustomerListParams) customerIterator {
			return &fakeCustomerIterator{customers: []*stripe.Customer{
				{ID: "cus-4", Desc: "Customer for Google email: boom@example.com", Meta: map[string]string{}},
			}}
		}
		updateCustomer = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return nil, errors.New("update failed")
		}

		defer func() {
			if recover() == nil {
				t.Fatal("expected panic on update failure")
			}
		}()

		updateCustomerEmails()
	})
}
