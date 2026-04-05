package contact

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/rs/rest-layer/resource"
)

type cacheStub struct {
	items map[string]interface{}
}

func newCacheStub() *cacheStub {
	return &cacheStub{items: map[string]interface{}{}}
}

func (c *cacheStub) ItemCount() int {
	return len(c.items)
}

func (c *cacheStub) SetDefault(key string, value interface{}) {
	c.items[key] = value
}

func TestBeforeInsert(t *testing.T) {
	cache := newCacheStub()
	svc := NewService(cache, 2, "support@example.com", nil)

	items := []*resource.Item{{ID: "req-1"}, {ID: "req-2"}}
	if err := svc.BeforeInsert(context.Background(), items); err != nil {
		t.Fatalf("unexpected insert hook error: %v", err)
	}

	if cache.ItemCount() != 0 {
		t.Fatalf("expected cache to remain unchanged before insert, got %d", cache.ItemCount())
	}

	cache.SetDefault("existing-1", "existing-1")
	cache.SetDefault("existing-2", "existing-2")
	err := svc.BeforeInsert(context.Background(), []*resource.Item{{ID: "req-3"}})
	if err == nil {
		t.Fatal("expected insert hook to reject above threshold")
	}
	if err.Error() != "Too many contact requests, try again later" {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestAfterInsertNoopOnError(t *testing.T) {
	cache := newCacheStub()
	svc := NewService(cache, 10, "support@example.com", nil)

	incomingErr := errors.New("storage failure")
	err := error(incomingErr)
	svc.AfterInsert(context.Background(), []*resource.Item{{ID: "req-1"}}, &err)

	if cache.ItemCount() != 0 {
		t.Fatalf("did not expect cache to be updated, got %d", cache.ItemCount())
	}
	if err == nil || err.Error() != "storage failure" {
		t.Fatalf("expected input error to be preserved, got %v", err)
	}
}

func TestBeforeInsertSendsEmail(t *testing.T) {
	sent := false
	svc := NewService(newCacheStub(), 10, "support@example.com", func(to []string, msg []byte) error {
		sent = true
		if len(to) != 1 || to[0] != "support@example.com" {
			t.Fatalf("unexpected recipients: %#v", to)
		}
		if !strings.Contains(string(msg), "Need help") {
			t.Fatalf("expected message content in email body, got %q", string(msg))
		}
		return nil
	})

	if err := svc.BeforeInsert(context.Background(), []*resource.Item{{
		ID: "req-1",
		Payload: map[string]interface{}{
			"message":       "Need help",
			"contact_email": "user@example.com",
		},
	}}); err != nil {
		t.Fatalf("unexpected insert hook error: %v", err)
	}

	if !sent {
		t.Fatal("expected sendEmail to be called")
	}
}

func TestBeforeInsertFailsWhenEmailSendFails(t *testing.T) {
	svc := NewService(newCacheStub(), 10, "support@example.com", func([]string, []byte) error {
		return errors.New("smtp failure")
	})

	err := svc.BeforeInsert(context.Background(), []*resource.Item{{
		ID: "req-1",
		Payload: map[string]interface{}{
			"message":       "Need help",
			"contact_email": "user@example.com",
		},
	}})
	if err == nil {
		t.Fatal("expected insert hook to fail when email send fails")
	}
	if err.Error() != "Unable to process contact request, please try again later" {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestAfterInsertCachesSuccessfulInsert(t *testing.T) {
	cache := newCacheStub()
	svc := NewService(cache, 10, "support@example.com", nil)

	var err error
	svc.AfterInsert(context.Background(), []*resource.Item{{ID: "req-1"}, {ID: "req-2"}}, &err)

	if cache.ItemCount() != 2 {
		t.Fatalf("expected cache to contain two entries, got %d", cache.ItemCount())
	}
}
