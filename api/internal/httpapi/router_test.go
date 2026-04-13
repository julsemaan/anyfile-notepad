package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRouter(t *testing.T) {
	apiCalled := false
	statsCalled := false

	apiHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiCalled = true
		w.WriteHeader(http.StatusAccepted)
	})
	statsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		statsCalled = true
		w.WriteHeader(http.StatusOK)
	})

	router := NewRouter(apiHandler, statsHandler, "user", "password")

	t.Run("stats route bypasses auth", func(t *testing.T) {
		apiCalled = false
		statsCalled = false

		req := httptest.NewRequest(http.MethodPost, "/stats", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if !statsCalled {
			t.Fatal("expected stats handler to be called")
		}
		if apiCalled {
			t.Fatal("did not expect api handler to be called")
		}
	})

	t.Run("stats prefix does not bypass auth", func(t *testing.T) {
		apiCalled = false
		statsCalled = false

		req := httptest.NewRequest(http.MethodPost, "/statsanything", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
		if statsCalled {
			t.Fatal("did not expect stats handler to be called")
		}
	})

	t.Run("protected route requires auth", func(t *testing.T) {
		apiCalled = false
		statsCalled = false

		req := httptest.NewRequest(http.MethodPost, "/syntaxes", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
		if apiCalled {
			t.Fatal("did not expect api handler to be called")
		}
	})

	t.Run("open route and cors headers", func(t *testing.T) {
		apiCalled = false
		statsCalled = false

		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if !apiCalled {
			t.Fatal("expected api handler to be called")
		}
		if w.Header().Get("Access-Control-Allow-Origin") != "*" {
			t.Fatal("expected cors headers")
		}
	})
}
