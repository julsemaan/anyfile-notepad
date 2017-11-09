package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	stripe "github.com/stripe/stripe-go"
)

func googleTestUserId(t *testing.T) string {
	googleTestUserId := os.Getenv("GOOGLE_TEST_USER_ID")

	if googleTestUserId == "" {
		t.Error("Google user ID is empty GOOGLE_TEST_USER_ID")
	}

	return googleTestUserId
}

func addGoogleTokenToRequest(t *testing.T, req *http.Request) {
	googleTestToken := os.Getenv("GOOGLE_TEST_TOKEN")

	if googleTestToken == "" {
		t.Error("Google user token is empty GOOGLE_TEST_TOKEN")
	}

	req.AddCookie(&http.Cookie{Name: "access_token", Value: googleTestToken})
}

func TestGoogleUserAuth(t *testing.T) {
	h := &Handler{}

	subscriptions.SetSubscription(&stripe.Sub{
		Status: "active",
		Meta: map[string]string{
			"user_id": googleTestUserId(t),
		},
	})

	subscriptions.SetSubscription(&stripe.Sub{
		Status: "active",
		Meta: map[string]string{
			"user_id": testUserId,
		},
	})

	req, _ := http.NewRequest("GET", "/api/billing/subscription/"+googleTestUserId(t), nil)
	addGoogleTokenToRequest(t, req)

	recorder := httptest.NewRecorder()
	h.ServeHTTP(recorder, req)
	resp := recorder.Result()

	if resp.StatusCode != http.StatusOK {
		t.Error("Request with a valid Google user ID for its subscription is OK")
	}

	// request from a user to a different user
	req, _ = http.NewRequest("GET", "/api/billing/subscription/"+testUserId, nil)
	addGoogleTokenToRequest(t, req)

	recorder = httptest.NewRecorder()
	h.ServeHTTP(recorder, req)
	resp = recorder.Result()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Error("Request with a valid Google user ID for its subscription is denied")
	}

	// request from a user to a different user
	req, _ = http.NewRequest("GET", "/api/billing/subscription/"+testUserId, nil)
	req.AddCookie(&http.Cookie{Name: "access_token", Value: "vidange"})

	recorder = httptest.NewRecorder()
	h.ServeHTTP(recorder, req)
	resp = recorder.Result()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Error("Request with an invalid Google token is denied")
	}
}
