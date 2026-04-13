package httpapi

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWithAccessLog(t *testing.T) {
	t.Run("logs response status", func(t *testing.T) {
		var logBuffer bytes.Buffer
		originalWriter := log.Writer()
		defer log.SetOutput(originalWriter)
		log.SetOutput(&logBuffer)

		handler := withAccessLog(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusAccepted)
		}))

		req := httptest.NewRequest(http.MethodGet, "/syntaxes", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		output := logBuffer.String()
		if !strings.Contains(output, "access method=GET path=/syntaxes status=202") {
			t.Fatalf("expected access log line for status 202, got %q", output)
		}
	})

	t.Run("logs default status when no explicit write header", func(t *testing.T) {
		var logBuffer bytes.Buffer
		originalWriter := log.Writer()
		defer log.SetOutput(originalWriter)
		log.SetOutput(&logBuffer)

		handler := withAccessLog(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("ok"))
		}))

		req := httptest.NewRequest(http.MethodGet, "/stats", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		output := logBuffer.String()
		if !strings.Contains(output, "access method=GET path=/stats status=200") {
			t.Fatalf("expected access log line for status 200, got %q", output)
		}
	})
}
