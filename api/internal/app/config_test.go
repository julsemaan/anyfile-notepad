package app

import "testing"

func TestLoadConfigFromEnv(t *testing.T) {
	t.Run("uses default metrics listen addr when env is empty", func(t *testing.T) {
		t.Setenv("AFN_METRICS_LISTEN_ADDR", "")

		cfg := LoadConfigFromEnv()
		if cfg.MetricsListenAddr != defaultMetricsListenAddr {
			t.Fatalf("expected default metrics listen addr, got %q", cfg.MetricsListenAddr)
		}
	})

	t.Run("uses configured metrics listen addr when provided", func(t *testing.T) {
		t.Setenv("AFN_METRICS_LISTEN_ADDR", ":9191")

		cfg := LoadConfigFromEnv()
		if cfg.MetricsListenAddr != ":9191" {
			t.Fatalf("expected configured metrics listen addr, got %q", cfg.MetricsListenAddr)
		}
	})

	t.Run("uses default max contact requests when env is empty", func(t *testing.T) {
		t.Setenv(envMaxContactRequestsPerDay, "")

		cfg := LoadConfigFromEnv()
		if cfg.MaxContactRequestsPerDay != defaultContactRequestsPerDay {
			t.Fatalf("expected default max contact requests, got %d", cfg.MaxContactRequestsPerDay)
		}
	})

	t.Run("uses configured max contact requests when valid", func(t *testing.T) {
		t.Setenv(envMaxContactRequestsPerDay, "25")

		cfg := LoadConfigFromEnv()
		if cfg.MaxContactRequestsPerDay != 25 {
			t.Fatalf("expected configured max contact requests, got %d", cfg.MaxContactRequestsPerDay)
		}
	})

	t.Run("falls back to default when invalid", func(t *testing.T) {
		t.Setenv(envMaxContactRequestsPerDay, "invalid")

		cfg := LoadConfigFromEnv()
		if cfg.MaxContactRequestsPerDay != defaultContactRequestsPerDay {
			t.Fatalf("expected default max contact requests, got %d", cfg.MaxContactRequestsPerDay)
		}
	})

	t.Run("falls back to default when non positive", func(t *testing.T) {
		t.Setenv(envMaxContactRequestsPerDay, "0")

		cfg := LoadConfigFromEnv()
		if cfg.MaxContactRequestsPerDay != defaultContactRequestsPerDay {
			t.Fatalf("expected default max contact requests, got %d", cfg.MaxContactRequestsPerDay)
		}
	})
}
