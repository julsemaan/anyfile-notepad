package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	stripe "github.com/stripe/stripe-go"
)

var testUserId = "bing-bang-boum"

func setupHTTPTestEnvironment(t *testing.T) {
	t.Helper()

	rootDir := t.TempDir()
	devDir := filepath.Join(rootDir, "dev")
	siteDir := filepath.Join(rootDir, "site")

	for _, dir := range []string{devDir, siteDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed creating test dir %s: %v", dir, err)
		}
	}

	fixtures := map[string]string{
		filepath.Join(rootDir, "app.html"):            "app.html\n",
		filepath.Join(rootDir, "app-plus-plus.html"):  "app-plus-plus.html\n",
		filepath.Join(devDir, "app.html"):             "dev/app.html\n",
		filepath.Join(siteDir, "news.html"):           "site/news.html\n",
		filepath.Join(siteDir, "faq.html"):            "site/faq.html\n",
		filepath.Join(siteDir, "blocked_user.html"):   "site/blocked_user.html\n",
		filepath.Join(siteDir, "help_translate.html"): "site/help_translate.html\n",
	}

	for path, content := range fixtures {
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatalf("failed writing fixture %s: %v", path, err)
		}
	}

	prodAppPath = rootDir
	devAppPath = devDir
	subscriptions = NewSubscriptions()
	plusPlusSessions = NewPlusPlusSessions()
	setupHandlers()
}

func TestHTTPHandler(t *testing.T) {
	setupHTTPTestEnvironment(t)

	// testing aliases
	testGetStaticResource(t, "/app", http.StatusOK, "app.html\n", false, "")
	testGetStaticResource(t, "/app.html", http.StatusOK, "app.html\n", false, "")
	testGetStaticResource(t, "/news.html", http.StatusOK, "site/news.html\n", false, "")
	testGetStaticResource(t, "/faq.html", http.StatusOK, "site/faq.html\n", false, "")

	// Testing potential bypadd
	testGetStaticResource(t, "/app-plus-plus.html", http.StatusOK, "app.html\n", false, "")

	// Testing dev mode
	testGetStaticResource(t, "/app", http.StatusOK, "dev/app.html\n", true, "")

	// Testing user with subscription
	subscriptions.SetSubscription(&stripe.Sub{
		Status: "active",
		Meta: map[string]string{
			"user_id": testUserId,
		},
	})

	testGetStaticResource(t, "/app", http.StatusOK, "app-plus-plus.html\n", false, testUserId)

	// testing user with cancelled subscription
	subscriptions.SetSubscription(&stripe.Sub{
		Status: "canceled",
		Meta: map[string]string{
			"user_id": testUserId,
		},
	})

	testGetStaticResource(t, "/app", http.StatusOK, "app.html\n", false, testUserId)
}

func testGetStaticResource(t *testing.T, path string, expectedCode int, expectedBody string, devMode bool, userId string) {
	h := Handler{}

	req, _ := http.NewRequest("GET", path, nil)

	if devMode {
		req.AddCookie(&http.Cookie{Name: "AFNVersion", Value: "dev"})
	}

	if userId != "" {
		req.AddCookie(&http.Cookie{Name: "current_google_user_id", Value: userId})
	}

	recorder := httptest.NewRecorder()
	h.ServeHTTP(recorder, req)
	resp := recorder.Result()

	if resp.StatusCode != expectedCode || recorder.Body.String() != expectedBody {
		t.Error("Something went wrong while testing", path, "got status code", resp.StatusCode, "and body", recorder.Body.String())
	}
}

func TestHTTPHandlerRoutesAndHeaders(t *testing.T) {
	setupHTTPTestEnvironment(t)

	h := Handler{}

	t.Run("routes /events to events handler", func(t *testing.T) {
		original := eventsHandler
		t.Cleanup(func() { eventsHandler = original })
		eventsHandler = func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}

		req := httptest.NewRequest(http.MethodGet, "/events", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rr.Code)
		}
	})

	t.Run("routes realtime endpoint to realtime handler", func(t *testing.T) {
		original := realtimeHandler
		t.Cleanup(func() { realtimeHandler = original })
		realtimeHandler = func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusAccepted)
		}

		req := httptest.NewRequest(http.MethodGet, "/api/collaboration/realtime_events", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusAccepted {
			t.Fatalf("expected 202, got %d", rr.Code)
		}
	})

	t.Run("routes api namespace to api handler", func(t *testing.T) {
		original := apiHandler
		t.Cleanup(func() { apiHandler = original })
		apiHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
		})

		req := httptest.NewRequest(http.MethodGet, "/api/anything", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", rr.Code)
		}
	})

	t.Run("blocked users are redirected to blocked page", func(t *testing.T) {
		originalBlocked := blockedUsersMap
		t.Cleanup(func() { blockedUsersMap = originalBlocked })
		blockedUsersMap = map[string]bool{"blocked-user": true}

		req := httptest.NewRequest(http.MethodGet, "/app.html", nil)
		req.AddCookie(&http.Cookie{Name: "current_google_user_id", Value: "blocked-user"})
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
		if !strings.Contains(rr.Body.String(), "site/blocked_user.html") {
			t.Fatalf("expected blocked user page, got %q", rr.Body.String())
		}
	})

	t.Run("app and ace resources disable cache and include report-to", func(t *testing.T) {
		t.Setenv("REPORT_TO", "{\"group\":\"csp\"}")

		req := httptest.NewRequest(http.MethodGet, "/ace.js", nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if rr.Header().Get("Cache-Control") == "" {
			t.Fatal("expected cache-control to be set for ace.js")
		}
		if rr.Header().Get("Report-To") == "" {
			t.Fatal("expected report-to header to be present")
		}
	})

	t.Run("valid plus plus session cookie yields plus-plus app", func(t *testing.T) {
		originalSessions := plusPlusSessions
		originalSubs := subscriptions
		t.Cleanup(func() {
			plusPlusSessions = originalSessions
			subscriptions = originalSubs
		})

		plusPlusSessions = NewPlusPlusSessions()
		subscriptions = NewSubscriptions()
		_ = subscriptions.SetSubscription(&stripe.Sub{
			Status: SubscriptionStatusActive,
			Meta:   map[string]string{"user_id": "user-from-session"},
		})
		plusPlusSessions.Set("sid-1", &PlusPlusSession{GoogleUserId: "user-from-session", ValidUntil: time.Now().Add(time.Hour)})

		req := httptest.NewRequest(http.MethodGet, "/app.html", nil)
		req.AddCookie(&http.Cookie{Name: "ppsid", Value: "sid-1"})
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		if !strings.Contains(rr.Body.String(), "app-plus-plus.html") {
			t.Fatalf("expected plus-plus app for valid session, got %q", rr.Body.String())
		}
	})
}
