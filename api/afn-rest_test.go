package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	cache "github.com/patrickmn/go-cache"
	"github.com/rs/rest-layer/resource"
)

func TestParseStatsPayload(t *testing.T) {
	t.Run("uses forwarded for ip", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		req.Header.Set("X-Forwarded-For", "203.0.113.10, 70.41.3.18")
		w := httptest.NewRecorder()

		payload, err := parseStatsPayload(w, req)
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}

		if payload["ip"] != "203.0.113.10" {
			t.Fatalf("expected forwarded ip, got %q", payload["ip"])
		}
	})

	t.Run("uses remote addr when header missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		req.RemoteAddr = "192.0.2.15:43210"
		w := httptest.NewRecorder()

		payload, err := parseStatsPayload(w, req)
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}

		if payload["ip"] != "192.0.2.15" {
			t.Fatalf("expected remote ip, got %q", payload["ip"])
		}
	})

	t.Run("invalid json returns bad request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"broken":`))
		req.RemoteAddr = "192.0.2.15:43210"
		w := httptest.NewRecorder()

		_, err := parseStatsPayload(w, req)
		if err == nil {
			t.Fatal("expected parse error")
		}
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected bad request status, got %d", w.Code)
		}
	})
}

func TestIsOpenResource(t *testing.T) {
	cases := []struct {
		name     string
		method   string
		path     string
		expected bool
	}{
		{name: "options always open", method: http.MethodOptions, path: "/anything", expected: true},
		{name: "contact_requests post open", method: http.MethodPost, path: "/contact_requests", expected: true},
		{name: "contact_requests get closed", method: http.MethodGet, path: "/contact_requests", expected: false},
		{name: "get open", method: http.MethodGet, path: "/syntaxes", expected: true},
		{name: "post protected", method: http.MethodPost, path: "/syntaxes", expected: false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			if isOpenResource(req) != tc.expected {
				t.Fatalf("expected %v", tc.expected)
			}
		})
	}
}

func TestAuthenticate(t *testing.T) {
	t.Setenv("AFN_REST_USERNAME", "test-user")
	t.Setenv("AFN_REST_PASSWORD", "test-pass")

	t.Run("accepts valid basic auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		req.SetBasicAuth("test-user", "test-pass")
		w := httptest.NewRecorder()

		if !authenticate(w, req) {
			t.Fatal("expected authentication to pass")
		}
	})

	t.Run("rejects invalid basic auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		req.SetBasicAuth("bad-user", "bad-pass")
		w := httptest.NewRecorder()

		if authenticate(w, req) {
			t.Fatal("expected authentication to fail")
		}
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected unauthorized status, got %d", w.Code)
		}
		if strings.TrimSpace(w.Body.String()) != "Unauthorized" {
			t.Fatalf("expected unauthorized body, got %q", w.Body.String())
		}
	})
}

func TestInsertContactRequestHook(t *testing.T) {
	originalCache := contactRequestsCache
	originalMax := maxContactRequestsPerDay
	contactRequestsCache = cache.New(24*time.Hour, time.Minute)
	maxContactRequestsPerDay = 2
	t.Cleanup(func() {
		contactRequestsCache = originalCache
		maxContactRequestsPerDay = originalMax
	})

	items := []*resource.Item{{ID: "req-1"}, {ID: "req-2"}}
	if err := insertContactRequestHook(context.Background(), items); err != nil {
		t.Fatalf("unexpected insert hook error: %v", err)
	}

	if contactRequestsCache.ItemCount() != 2 {
		t.Fatalf("expected cache to contain two entries, got %d", contactRequestsCache.ItemCount())
	}

	err := insertContactRequestHook(context.Background(), []*resource.Item{{ID: "req-3"}})
	if err == nil {
		t.Fatal("expected insert hook to reject above threshold")
	}
	if err.Error() != "Too many contact requests, try again later" {
		t.Fatalf("unexpected error message: %v", err)
	}
}

func TestInsertedContactRequestHookNoopOnError(t *testing.T) {
	incomingErr := errors.New("storage failure")
	err := error(incomingErr)
	insertedContactRequestHook(context.Background(), []*resource.Item{{ID: "req-1"}}, &err)

	if err == nil || err.Error() != "storage failure" {
		t.Fatalf("expected input error to be preserved, got %v", err)
	}
}

func TestEmailValidator(t *testing.T) {
	v := emailValidator{}

	if _, err := v.Validate("name@example.com"); err != nil {
		t.Fatalf("expected valid email, got error: %v", err)
	}

	if _, err := v.Validate("not-an-email"); err == nil {
		t.Fatal("expected invalid email to fail validation")
	}
}

func TestInsertedContactRequestHookSendsEmail(t *testing.T) {
	originalSend := sendEmail
	t.Cleanup(func() {
		sendEmail = originalSend
	})

	t.Setenv("AFN_SUPPORT_EMAIL", "support@example.com")
	sent := false
	sendEmail = func(to []string, msg []byte) error {
		sent = true
		if len(to) != 1 || to[0] != "support@example.com" {
			t.Fatalf("unexpected recipients: %#v", to)
		}
		if !strings.Contains(string(msg), "Need help") {
			t.Fatalf("expected message content in email body, got %q", string(msg))
		}
		return nil
	}

	var err error
	insertedContactRequestHook(context.Background(), []*resource.Item{{
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

func TestHandleStats(t *testing.T) {
	t.Run("returns OK on increment stats payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		req.RemoteAddr = "192.0.2.15:12345"
		w := httptest.NewRecorder()

		handleStats(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if strings.TrimSpace(w.Body.String()) != "OK" {
			t.Fatalf("unexpected body: %q", w.Body.String())
		}
	})

	t.Run("returns OK on non-increment payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"noop","key":"hits"}`))
		req.RemoteAddr = "192.0.2.16:12345"
		w := httptest.NewRecorder()

		handleStats(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if strings.TrimSpace(w.Body.String()) != "OK" {
			t.Fatalf("unexpected body: %q", w.Body.String())
		}
	})
}
