package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

func TestGetGoogleOauth2Conf(t *testing.T) {
	originalBaseURL := appBaseURL
	t.Cleanup(func() {
		appBaseURL = originalBaseURL
	})

	appBaseURL = "https://app.example.com"
	t.Setenv("GOOGLE_CLIENT_ID", "cid")
	t.Setenv("GOOGLE_CLIENT_SECRET", "secret")

	conf := getGoogleOauth2Conf(googleOauth2ConfOptions{})
	if conf.ClientID != "cid" || conf.ClientSecret != "secret" {
		t.Fatalf("unexpected oauth2 client credentials")
	}
	if conf.RedirectURL != "https://app.example.com/api/oauth2/google/callback" {
		t.Fatalf("unexpected redirect url: %s", conf.RedirectURL)
	}

	override := getGoogleOauth2Conf(googleOauth2ConfOptions{redirectUrl: "https://other/callback"})
	if override.RedirectURL != "https://other/callback" {
		t.Fatalf("expected redirect override, got %s", override.RedirectURL)
	}
}

func TestHandleGoogleOauth2Authorize(t *testing.T) {
	gin.SetMode(gin.TestMode)
	originalBuilder := googleOauth2ConfBuilder
	t.Cleanup(func() {
		googleOauth2ConfBuilder = originalBuilder
	})

	googleOauth2ConfBuilder = func(opts googleOauth2ConfOptions) *oauth2.Config {
		return &oauth2.Config{
			ClientID:    "cid",
			RedirectURL: opts.redirectUrl,
			Endpoint: oauth2.Endpoint{
				AuthURL: "https://accounts.example.com/auth",
			},
		}
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/oauth2/google/authorize?redirect_url=https%3A%2F%2Ffront%2Fcb&login_hint=user%40example.com", nil)

	handleGoogleOauth2Authorize(c)

	if w.Code != http.StatusFound {
		t.Fatalf("expected %d, got %d", http.StatusFound, w.Code)
	}
	loc := w.Header().Get("Location")
	if !strings.HasPrefix(loc, "https://accounts.example.com/auth?") {
		t.Fatalf("unexpected location: %s", loc)
	}
	if !strings.Contains(loc, "redirect_uri=https%3A%2F%2Ffront%2Fcb") {
		t.Fatalf("expected redirect_url to be propagated, got %s", loc)
	}
	if !strings.Contains(loc, "login_hint=user@example.com") {
		t.Fatalf("expected login hint in redirect, got %s", loc)
	}
}

func TestHandleGoogleOauth2Callback(t *testing.T) {
	gin.SetMode(gin.TestMode)
	originalExchange := googleOauth2Exchange
	t.Cleanup(func() {
		googleOauth2Exchange = originalExchange
	})

	t.Run("redirects to app with access token", func(t *testing.T) {
		googleOauth2Exchange = func(code string) (*oauth2.Token, error) {
			if code != "abc123" {
				t.Fatalf("unexpected code: %s", code)
			}
			return &oauth2.Token{AccessToken: "token-1"}, nil
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/oauth2/google/callback?code=abc123", nil)

		handleGoogleOauth2Callback(c)

		if w.Code != http.StatusFound {
			t.Fatalf("expected redirect status, got %d", w.Code)
		}
		loc := w.Header().Get("Location")
		if loc != "/app#google_access_token=token-1" {
			t.Fatalf("unexpected redirect location: %s", loc)
		}
	})

	t.Run("returns 500 when token exchange fails", func(t *testing.T) {
		googleOauth2Exchange = func(code string) (*oauth2.Token, error) {
			return nil, errors.New("exchange failed")
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/oauth2/google/callback?code=x", nil)

		handleGoogleOauth2Callback(c)

		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "Unable to convert authorization code into token") {
			t.Fatalf("unexpected body: %s", w.Body.String())
		}
	})

}
