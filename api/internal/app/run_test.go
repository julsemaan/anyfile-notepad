package app

import (
	"bytes"
	"errors"
	"log"
	"net/http"
	"strings"
	"testing"
)

type stubServer struct {
	err error
}

func (s stubServer) ListenAndServe() error {
	return s.err
}

func TestLogURL(t *testing.T) {
	t.Run("adds localhost for port only address", func(t *testing.T) {
		got := logURL(":8080", "")
		if got != "http://localhost:8080" {
			t.Fatalf("expected localhost url, got %q", got)
		}
	})

	t.Run("uses host qualified address as is", func(t *testing.T) {
		got := logURL("0.0.0.0:9090", "/metrics")
		if got != "http://0.0.0.0:9090/metrics" {
			t.Fatalf("expected host-qualified url, got %q", got)
		}
	})
}

func TestServeMetrics(t *testing.T) {
	var buf bytes.Buffer
	oldWriter := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(oldWriter)

	serveMetrics(stubServer{err: errors.New("boom")}, ":9090")
	if !strings.Contains(buf.String(), "Prometheus metrics server stopped: boom") {
		t.Fatalf("expected metrics error to be logged, got %q", buf.String())
	}
}

func TestServeAPI(t *testing.T) {
	t.Run("returns listener errors", func(t *testing.T) {
		err := serveAPI(stubServer{err: errors.New("boom")}, ":8080")
		if err == nil || err.Error() != "boom" {
			t.Fatalf("expected api listener error, got %v", err)
		}
	})

	t.Run("treats server closed as success", func(t *testing.T) {
		if err := serveAPI(stubServer{err: http.ErrServerClosed}, ":8080"); err != nil {
			t.Fatalf("expected nil for closed server, got %v", err)
		}
	})
}
