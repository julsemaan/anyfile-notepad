package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsOpenResource(t *testing.T) {
	testCases := []struct {
		name     string
		method   string
		path     string
		expected bool
	}{
		{name: "options always open", method: http.MethodOptions, path: "/anything", expected: true},
		{name: "contact requests post open", method: http.MethodPost, path: "/contact_requests", expected: true},
		{name: "contact requests get closed", method: http.MethodGet, path: "/contact_requests", expected: false},
		{name: "read resource open", method: http.MethodGet, path: "/syntaxes", expected: true},
		{name: "write resource closed", method: http.MethodPost, path: "/syntaxes", expected: false},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			req := httptest.NewRequest(testCase.method, testCase.path, nil)
			if IsOpenResource(req) != testCase.expected {
				t.Fatalf("expected %v", testCase.expected)
			}
		})
	}
}

func TestAuthenticate(t *testing.T) {
	t.Run("accepts valid basic auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		req.SetBasicAuth("good-user", "good-password")
		w := httptest.NewRecorder()

		if !Authenticate(w, req, "good-user", "good-password") {
			t.Fatal("expected authentication to pass")
		}
	})

	t.Run("rejects invalid basic auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		req.SetBasicAuth("bad-user", "bad-password")
		w := httptest.NewRecorder()

		if Authenticate(w, req, "good-user", "good-password") {
			t.Fatal("expected authentication to fail")
		}
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected unauthorized status, got %d", w.Code)
		}
		if w.Body.String() != "Unauthorized" {
			t.Fatalf("expected unauthorized body, got %q", w.Body.String())
		}
	})

	t.Run("rejects missing basic auth", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		w := httptest.NewRecorder()

		if Authenticate(w, req, "good-user", "good-password") {
			t.Fatal("expected missing auth to fail")
		}
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected unauthorized status, got %d", w.Code)
		}
	})
}
