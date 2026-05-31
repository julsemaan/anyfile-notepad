package app

import "testing"

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
