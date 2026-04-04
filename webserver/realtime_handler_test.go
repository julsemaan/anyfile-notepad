package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestPublishRealtimeEventInvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodPost, "/api/collaboration/realtime_events/editor", strings.NewReader("{"))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	c.Params = gin.Params{{Key: "category", Value: "editor"}}

	publishRealtimeEvent(c)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
	if !strings.Contains(w.Body.String(), "Failed to decode JSON body") {
		t.Fatalf("expected json decode error message, got %q", w.Body.String())
	}
}

func TestPublishRealtimeEvent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	originalPublish := publishRealtime
	t.Cleanup(func() {
		publishRealtime = originalPublish
	})

	t.Run("returns 500 when publish fails", func(t *testing.T) {
		publishRealtime = func(category string, event map[string]interface{}) error {
			if category != "editor" {
				t.Fatalf("unexpected category: %s", category)
			}
			return errors.New("manager unavailable")
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req := httptest.NewRequest(http.MethodPost, "/api/collaboration/realtime_events/editor", strings.NewReader(`{"event":"typing"}`))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req
		c.Params = gin.Params{{Key: "category", Value: "editor"}}

		publishRealtimeEvent(c)

		if w.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "Failed to publish event") {
			t.Fatalf("expected publish failure message, got %q", w.Body.String())
		}
	})

	t.Run("returns 200 when publish succeeds", func(t *testing.T) {
		publishRealtime = func(category string, event map[string]interface{}) error {
			if event["event"] != "typing" {
				t.Fatalf("unexpected payload: %#v", event)
			}
			return nil
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		req := httptest.NewRequest(http.MethodPost, "/api/collaboration/realtime_events/editor", strings.NewReader(`{"event":"typing"}`))
		req.Header.Set("Content-Type", "application/json")
		c.Request = req
		c.Params = gin.Params{{Key: "category", Value: "editor"}}

		publishRealtimeEvent(c)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), `"message":"ok"`) {
			t.Fatalf("unexpected success body: %q", w.Body.String())
		}
	})
}
