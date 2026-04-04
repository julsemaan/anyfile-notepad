package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"

	stripe "github.com/stripe/stripe-go"
)

var testUserId = "bing-bang-boum"
var setupHTTPTestEnvironmentOnce sync.Once

func setupHTTPTestEnvironment(t *testing.T) {
	t.Helper()

	setupHTTPTestEnvironmentOnce.Do(func() {
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
	})
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
