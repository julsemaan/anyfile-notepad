package main

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	stripe "github.com/stripe/stripe-go"
)

func setupBillingSubscriptionReadRouter() *gin.Engine {
	r := gin.New()
	subscription := r.Group("/api/billing/subscription")
	subscription.Use(LoadSubscription)
	subscription.Use(LoadGoogleUser)
	subscription.GET("/:user_id", handleSubscriptionRead)
	return r
}

func TestRenderEmailTemplate(t *testing.T) {
	out, err := renderEmailTemplate("Hello {{.Name}}", struct{ Name string }{Name: "Ada"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out != "Hello Ada" {
		t.Fatalf("unexpected template output: %q", out)
	}

	if _, err := renderEmailTemplate("{{", nil); err == nil {
		t.Fatal("expected template parse failure")
	}
}

func TestLoadGoogleUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	originalDo := doHTTPRequest
	t.Cleanup(func() { doHTTPRequest = originalDo })

	newContext := func(cookieValue string) (*gin.Context, *httptest.ResponseRecorder) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req := httptest.NewRequest(http.MethodGet, "/api/billing/subscription/user-1", nil)
		if cookieValue != "" {
			req.AddCookie(&http.Cookie{Name: "access_token", Value: cookieValue})
		}
		c.Request = req
		c.Params = gin.Params{{Key: "user_id", Value: "user-1"}}
		return c, w
	}

	t.Run("aborts when Google user fetch fails", func(t *testing.T) {
		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			return nil, errors.New("boom")
		}
		c, w := newContext("token")
		LoadGoogleUser(c)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("aborts on non-200 response", func(t *testing.T) {
		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: http.StatusForbidden, Body: io.NopCloser(strings.NewReader("forbidden"))}, nil
		}
		c, w := newContext("token")
		LoadGoogleUser(c)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})

	t.Run("sets google_user when validated", func(t *testing.T) {
		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			if got := req.Header.Get("Authorization"); got != "Bearer token" {
				t.Fatalf("unexpected auth header: %s", got)
			}
			return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"Id":"user-1","Email":"u@example.com"}`))}, nil
		}
		c, w := newContext("token")
		LoadGoogleUser(c)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if got, ok := c.Get("google_user"); !ok || got == nil {
			t.Fatal("expected google_user to be set in context")
		}
	})

	t.Run("aborts when Google user id mismatches route user id", func(t *testing.T) {
		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"Id":"user-2","Email":"u@example.com"}`))}, nil
		}
		c, w := newContext("token")
		LoadGoogleUser(c)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", w.Code)
		}
	})
}

func TestBillingSubscriptionReadRoute(t *testing.T) {
	gin.SetMode(gin.TestMode)
	originalDo := doHTTPRequest
	originalSubs := subscriptions
	t.Cleanup(func() {
		doHTTPRequest = originalDo
		subscriptions = originalSubs
	})

	subscriptions = NewSubscriptions()
	router := setupBillingSubscriptionReadRouter()

	newRequest := func(userID, token string) *http.Request {
		req := httptest.NewRequest(http.MethodGet, "/api/billing/subscription/"+userID, nil)
		if token != "" {
			req.AddCookie(&http.Cookie{Name: "access_token", Value: token})
		}
		return req
	}

	t.Run("returns not found when subscription does not exist", func(t *testing.T) {
		calledGoogle := false
		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			calledGoogle = true
			return nil, errors.New("should not be called")
		}

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, newRequest("missing-user", "token"))

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}
		if calledGoogle {
			t.Fatal("expected Google user lookup to be skipped")
		}
	})

	t.Run("returns ok for matching authenticated user", func(t *testing.T) {
		err := subscriptions.SetSubscription(&stripe.Sub{Status: SubscriptionStatusActive, Meta: map[string]string{"user_id": "user-1"}})
		if err != nil {
			t.Fatalf("failed setting subscription: %v", err)
		}

		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			if got := req.Header.Get("Authorization"); got != "Bearer token-ok" {
				t.Fatalf("unexpected auth header: %s", got)
			}
			return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"Id":"user-1","Email":"u@example.com"}`))}, nil
		}

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, newRequest("user-1", "token-ok"))

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
		if !strings.Contains(rr.Body.String(), `"status":"active"`) {
			t.Fatalf("expected subscription payload, got %q", rr.Body.String())
		}
	})

	t.Run("returns unauthorized when authenticated Google user differs", func(t *testing.T) {
		err := subscriptions.SetSubscription(&stripe.Sub{Status: SubscriptionStatusActive, Meta: map[string]string{"user_id": "user-2"}})
		if err != nil {
			t.Fatalf("failed setting subscription: %v", err)
		}

		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(`{"Id":"other-user","Email":"u@example.com"}`))}, nil
		}

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, newRequest("user-2", "token-ok"))

		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})

	t.Run("returns unauthorized for invalid Google token", func(t *testing.T) {
		err := subscriptions.SetSubscription(&stripe.Sub{Status: SubscriptionStatusActive, Meta: map[string]string{"user_id": "user-3"}})
		if err != nil {
			t.Fatalf("failed setting subscription: %v", err)
		}

		doHTTPRequest = func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: http.StatusForbidden, Body: io.NopCloser(strings.NewReader("forbidden"))}, nil
		}

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, newRequest("user-3", "bad-token"))

		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})
}

func TestHandleSubscriptionCancelAndResumeValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("cancel returns bad request when already canceled", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Set("subscription", &stripe.Sub{EndCancel: true, PeriodEnd: 1})
		handleSubscriptionCancel(c)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("resume returns bad request when not canceled", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/", nil)
		c.Params = gin.Params{{Key: "user_id", Value: "u1"}}
		c.Set("subscription", &stripe.Sub{EndCancel: false})
		handleSubscriptionResume(c)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})
}

func TestHandleSubscriptionResume(t *testing.T) {
	setupHTTPTestEnvironment(t)
	gin.SetMode(gin.TestMode)

	originalUpdate := stripeSubUpdate
	originalSubs := subscriptions
	t.Cleanup(func() {
		stripeSubUpdate = originalUpdate
		subscriptions = originalSubs
	})

	subscriptions = NewSubscriptions()

	t.Run("returns 500 when Stripe update fails", func(t *testing.T) {
		stripeSubUpdate = func(id string, params *stripe.SubParams) (*stripe.Sub, error) {
			return nil, errors.New("stripe unavailable")
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/", nil)
		c.Params = gin.Params{{Key: "user_id", Value: "u1"}}
		c.Set("subscription", &stripe.Sub{ID: "sub-1", EndCancel: true, Meta: map[string]string{"user_id": "u1"}})

		handleSubscriptionResume(c)

		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
	})

	t.Run("resumes canceled subscription", func(t *testing.T) {
		stripeSubUpdate = func(id string, params *stripe.SubParams) (*stripe.Sub, error) {
			if id != "sub-2" {
				t.Fatalf("unexpected subscription id: %s", id)
			}
			if params == nil || params.EndCancel != false {
				t.Fatalf("expected EndCancel=false params, got %#v", params)
			}
			return &stripe.Sub{ID: id, EndCancel: false, Meta: map[string]string{"user_id": "u2"}}, nil
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/", nil)
		c.Params = gin.Params{{Key: "user_id", Value: "u2"}}
		c.Set("subscription", &stripe.Sub{ID: "sub-2", EndCancel: true, Meta: map[string]string{"user_id": "u2"}})

		handleSubscriptionResume(c)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if got := subscriptions.GetSubscription("u2"); got == nil || got.ID != "sub-2" {
			t.Fatalf("expected resumed subscription to be saved, got %#v", got)
		}
	})
}

func TestHandleSubscriptionUpgrade(t *testing.T) {
	setupHTTPTestEnvironment(t)
	gin.SetMode(gin.TestMode)

	originalCustomerNew := stripeCustomerNew
	originalSubNew := stripeSubNew
	originalSubs := subscriptions
	t.Cleanup(func() {
		stripeCustomerNew = originalCustomerNew
		stripeSubNew = originalSubNew
		subscriptions = originalSubs
	})

	subscriptions = NewSubscriptions()

	newCtx := func(body string) (*gin.Context, *httptest.ResponseRecorder) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req := httptest.NewRequest(http.MethodGet, "/api/billing/subscription?"+body, nil)
		c.Request = req
		return c, w
	}

	t.Run("invalid form redirects to empty failure URL", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req := httptest.NewRequest(http.MethodPost, "/api/billing/subscription", strings.NewReader("{"))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req

		handleSubscriptionUpgrade(c)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("customer creation failure redirects to failure URL", func(t *testing.T) {
		stripeCustomerNew = func(params *stripe.CustomerParams) (*stripe.Customer, error) {
			return nil, errors.New("customer create failed")
		}

		c, w := newCtx("user_id=u1&user_email=u%40example.com&stripeToken=tok&stripeEmail=billing%40example.com&success_url=https%3A%2F%2Fok.local&failure_url=https%3A%2F%2Ffail.local")
		handleSubscriptionUpgrade(c)

		if w.Code != http.StatusFound {
			t.Fatalf("expected 302, got %d", w.Code)
		}
		if got := w.Header().Get("Location"); got != "https://fail.local" {
			t.Fatalf("expected redirect to failure URL, got %q", got)
		}
	})

	t.Run("subscription creation failure redirects to failure URL", func(t *testing.T) {
		stripeCustomerNew = func(params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: "cus-1"}, nil
		}
		stripeSubNew = func(params *stripe.SubParams) (*stripe.Sub, error) {
			return nil, errors.New("sub create failed")
		}

		c, w := newCtx("user_id=u2&user_email=u2%40example.com&stripeToken=tok&stripeEmail=billing%40example.com&success_url=https%3A%2F%2Fok.local&failure_url=https%3A%2F%2Ffail.local")
		handleSubscriptionUpgrade(c)

		if w.Code != http.StatusFound {
			t.Fatalf("expected 302, got %d", w.Code)
		}
		if got := w.Header().Get("Location"); got != "https://fail.local" {
			t.Fatalf("expected redirect to failure URL, got %q", got)
		}
	})

	t.Run("successful upgrade creates subscription and redirects to success URL", func(t *testing.T) {
		stripeCustomerNew = func(params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: "cus-2"}, nil
		}
		stripeSubNew = func(params *stripe.SubParams) (*stripe.Sub, error) {
			if params.Customer != "cus-2" {
				t.Fatalf("unexpected customer on sub params: %s", params.Customer)
			}
			return &stripe.Sub{ID: "sub-3", Meta: map[string]string{"user_id": "u3"}}, nil
		}

		c, w := newCtx("user_id=u3&user_email=u3%40example.com&stripeToken=tok&stripeEmail=billing%40example.com&success_url=https%3A%2F%2Fok.local&failure_url=https%3A%2F%2Ffail.local")
		handleSubscriptionUpgrade(c)

		if w.Code != http.StatusFound {
			t.Fatalf("expected 302, got %d", w.Code)
		}
		if got := w.Header().Get("Location"); got != "https://ok.local" {
			t.Fatalf("expected success redirect, got %q", got)
		}
		if got := subscriptions.GetSubscription("u3"); got == nil || got.ID != "sub-3" {
			t.Fatalf("expected created subscription to be saved, got %#v", got)
		}
	})
}

func TestHandleLinkCancel(t *testing.T) {
	setupHTTPTestEnvironment(t)
	gin.SetMode(gin.TestMode)

	originalGet := stripeCustomerGet
	originalCancel := stripeSubCancel
	originalSend := sendEmail
	originalSubs := subscriptions
	t.Cleanup(func() {
		stripeCustomerGet = originalGet
		stripeSubCancel = originalCancel
		sendEmail = originalSend
		subscriptions = originalSubs
	})

	subscriptions = NewSubscriptions()

	newCtx := func(path string) (*gin.Context, *httptest.ResponseRecorder) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, path, nil)
		parts := strings.Split(strings.TrimPrefix(path, "/api/billing/link_cancel/"), "/")
		c.Params = gin.Params{{Key: "cus_id", Value: parts[0]}, {Key: "cancel_link_id", Value: parts[1]}}
		return c, w
	}

	t.Run("fails when cancel link id mismatches", func(t *testing.T) {
		stripeCustomerGet = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id, Meta: map[string]string{"cancel_link_id": "expected"}}, nil
		}
		c, w := newCtx("/api/billing/link_cancel/cus-1/other")
		handleLinkCancel(c)
		if w.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", w.Code)
		}
	})

	t.Run("sends notification email after successful cancel", func(t *testing.T) {
		stripeCustomerGet = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id, Email: "buyer@example.com", Meta: map[string]string{"cancel_link_id": "ok"}}, nil
		}
		stripeSubCancel = func(id string, params *stripe.SubParams) (*stripe.Sub, error) {
			return &stripe.Sub{ID: id, EndCancel: true, PeriodEnd: 2, Meta: map[string]string{"user_id": "u1"}}, nil
		}
		emailSent := false
		sendEmail = func(to []string, msg []byte) error {
			emailSent = true
			if len(to) != 1 {
				t.Fatalf("expected single recipient")
			}
			return nil
		}

		_ = subscriptions.SetSubscription(&stripe.Sub{
			ID:       "sub-1",
			Meta:     map[string]string{"user_id": "u1"},
			Customer: &stripe.Customer{ID: "cus-1"},
		})

		c, w := newCtx("/api/billing/link_cancel/cus-1/ok")
		handleLinkCancel(c)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !emailSent {
			t.Fatal("expected notification email to be sent")
		}
	})
}

func TestHandleStripeHook(t *testing.T) {
	setupHTTPTestEnvironment(t)
	gin.SetMode(gin.TestMode)

	originalConstruct := stripeWebhookConstructEvent
	originalGet := stripeCustomerGet
	originalUpdate := stripeCustomerUpdate
	originalSend := sendEmail
	originalGen := generateCancelLinkID
	t.Cleanup(func() {
		stripeWebhookConstructEvent = originalConstruct
		stripeCustomerGet = originalGet
		stripeCustomerUpdate = originalUpdate
		sendEmail = originalSend
		generateCancelLinkID = originalGen
	})

	newCtx := func(body string) (*gin.Context, *httptest.ResponseRecorder) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/api/billing/stripe-hook", strings.NewReader(body))
		c.Request.Header.Set("Stripe-Signature", "sig")
		return c, w
	}

	t.Run("invalid signature returns 400", func(t *testing.T) {
		stripeWebhookConstructEvent = func(payload []byte, header, secret string) (stripe.Event, error) {
			return stripe.Event{}, errors.New("invalid")
		}
		c, w := newCtx("{}")
		handleStripeHook(c)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("unsupported events return 500", func(t *testing.T) {
		stripeWebhookConstructEvent = func(payload []byte, header, secret string) (stripe.Event, error) {
			return stripe.Event{Type: "customer.created"}, nil
		}
		c, w := newCtx("{}")
		handleStripeHook(c)
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
	})

	t.Run("returns 500 when customer lookup fails", func(t *testing.T) {
		stripeWebhookConstructEvent = func(payload []byte, header, secret string) (stripe.Event, error) {
			return stripe.Event{Type: webhookEventInvoiceUpcoming, Data: &stripe.EventData{Raw: []byte(`{"customer":"cus-123","customer_email":"x@example.com"}`)}}, nil
		}
		stripeCustomerGet = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return nil, errors.New("not found")
		}
		c, w := newCtx("{}")
		handleStripeHook(c)
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
	})

	t.Run("returns 500 when sending renewal email fails", func(t *testing.T) {
		stripeWebhookConstructEvent = func(payload []byte, header, secret string) (stripe.Event, error) {
			return stripe.Event{Type: webhookEventInvoiceUpcoming, Data: &stripe.EventData{Raw: []byte(`{"customer":"cus-123","customer_email":"x@example.com"}`)}}, nil
		}
		stripeCustomerGet = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id, Email: "buyer@example.com", Meta: map[string]string{"google_email": "g@example.com", "cancel_link_id": "cid"}}, nil
		}
		sendEmail = func(to []string, msg []byte) error {
			return errors.New("smtp down")
		}
		c, w := newCtx("{}")
		handleStripeHook(c)
		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
	})

	t.Run("returns 200 on successful renewal notification", func(t *testing.T) {
		stripeWebhookConstructEvent = func(payload []byte, header, secret string) (stripe.Event, error) {
			return stripe.Event{Type: webhookEventInvoiceUpcoming, Data: &stripe.EventData{Raw: []byte(`{"customer":"cus-123","customer_email":"x@example.com"}`)}}, nil
		}
		stripeCustomerGet = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id, Email: "buyer@example.com", Meta: map[string]string{"google_email": "g@example.com", "cancel_link_id": "cid"}}, nil
		}
		stripeCustomerUpdate = func(id string, params *stripe.CustomerParams) (*stripe.Customer, error) {
			return &stripe.Customer{ID: id}, nil
		}
		generateCancelLinkID = func() string { return "fixed-link" }
		sendEmail = func(to []string, msg []byte) error { return nil }

		c, w := newCtx("{}")
		handleStripeHook(c)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
	})
}
