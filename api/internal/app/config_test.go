package app

import "testing"

func TestLoadConfigFromEnv(t *testing.T) {
	t.Run("uses default max contact requests when env missing", func(t *testing.T) {
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
