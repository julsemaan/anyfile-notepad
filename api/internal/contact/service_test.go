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

	if cache.ItemCount() != 2 {
		t.Fatalf("expected cache to contain two entries, got %d", cache.ItemCount())
	}

	err := svc.BeforeInsert(context.Background(), []*resource.Item{{ID: "req-3"}})
	if err == nil {
		t.Fatal("expected insert hook to reject above threshold")
	}
	if err.Error() != "Too many contact requests, try again later" {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestAfterInsertNoopOnError(t *testing.T) {
	sent := false
	svc := NewService(newCacheStub(), 10, "support@example.com", func([]string, []byte) error {
		sent = true
		return nil
	})

	incomingErr := errors.New("storage failure")
	err := error(incomingErr)
	svc.AfterInsert(context.Background(), []*resource.Item{{ID: "req-1"}}, &err)

	if sent {
		t.Fatal("did not expect email to be sent")
	}
	if err == nil || err.Error() != "storage failure" {
		t.Fatalf("expected input error to be preserved, got %v", err)
	}
}

func TestAfterInsertSendsEmail(t *testing.T) {
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

	var err error
	svc.AfterInsert(context.Background(), []*resource.Item{{
		ID: "req-1",
		Payload: map[string]interface{}{
			"message":       "Need help",
			"contact_email": "user@example.com",
		},
	}}, &err)

	if !sent {
		t.Fatal("expected sendEmail to be called")
	}
}
