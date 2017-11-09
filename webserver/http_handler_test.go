package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	stripe "github.com/stripe/stripe-go"
)

var testUserId = "bing-bang-boum"

func init() {
	cwd, _ := os.Getwd()
	os.Setenv("AFN_PROD_APP_PATH", cwd+"/testapp/")
	os.Setenv("AFN_DEV_APP_PATH", cwd+"/testapp/dev")

	setup()
}

func TestHTTPHandler(t *testing.T) {
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
