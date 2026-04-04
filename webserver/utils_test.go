package main

import (
	"testing"
)

func TestSecureRandomString(t *testing.T) {
	v := secureRandomString(8)
	if len(v) != 16 {
		t.Fatalf("expected encoded length 16, got %d", len(v))
	}
}

func TestEnvOrDefault(t *testing.T) {
	t.Setenv("AFN_TEST_ENV_OR_DEFAULT", "from-env")
	if got := EnvOrDefault("AFN_TEST_ENV_OR_DEFAULT", "fallback"); got != "from-env" {
		t.Fatalf("expected env value, got %q", got)
	}

	t.Setenv("AFN_TEST_ENV_OR_DEFAULT_EMPTY", "")
	if got := EnvOrDefault("AFN_TEST_ENV_OR_DEFAULT_EMPTY", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback value, got %q", got)
	}
}
