package httpapi

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/julsemaan/anyfile-notepad/api/internal/stats"
)

type statsServiceStub struct {
	payload  map[string]string
	err      error
	recorded bool
}

func (s *statsServiceStub) ParsePayload(*http.Request) (map[string]string, error) {
	if s.err != nil {
		return nil, s.err
	}
	return s.payload, nil
}

func (s *statsServiceStub) Record(map[string]string) {
	s.recorded = true
}

func TestStatsHandler(t *testing.T) {
	t.Run("returns OK on increment payload", func(t *testing.T) {
		stub := &statsServiceStub{payload: map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "hits"}}
		handler := NewStatsHandler(stub)

		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", w.Code)
		}
		if strings.TrimSpace(w.Body.String()) != "OK" {
			t.Fatalf("unexpected body: %q", w.Body.String())
		}
		if !stub.recorded {
			t.Fatal("expected stats payload to be recorded")
		}
	})

	t.Run("invalid json returns bad request", func(t *testing.T) {
		stub := &statsServiceStub{err: stats.ErrInvalidJSON}
		handler := NewStatsHandler(stub)

		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"broken":`))
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("invalid payload returns bad request", func(t *testing.T) {
		stub := &statsServiceStub{err: stats.ErrInvalidPayload}
		handler := NewStatsHandler(stub)

		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader("{}"))
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})

	t.Run("unknown errors return bad request", func(t *testing.T) {
		stub := &statsServiceStub{err: errors.New("boom")}
		handler := NewStatsHandler(stub)

		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader("{}"))
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", w.Code)
		}
	})
}
