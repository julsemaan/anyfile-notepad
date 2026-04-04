package utils

import (
	"errors"
	"net/smtp"
	"testing"
)

func TestSendEmail(t *testing.T) {
	t.Setenv("SMTP_USER", "smtp-user")
	t.Setenv("SMTP_PASSWORD", "smtp-pass")
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_PORT", "2525")
	t.Setenv("SMTP_FROM", "noreply@example.com")

	originalSender := smtpSendMail
	t.Cleanup(func() {
		smtpSendMail = originalSender
	})

	t.Run("successful send", func(t *testing.T) {
		called := false
		smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
			called = true
			if addr != "smtp.example.com:2525" {
				t.Fatalf("unexpected smtp addr: %s", addr)
			}
			if from != "noreply@example.com" {
				t.Fatalf("unexpected from address: %s", from)
			}
			if len(to) != 1 || to[0] != "support@example.com" {
				t.Fatalf("unexpected recipients: %#v", to)
			}
			if string(msg) != "Subject: test\n\nHello" {
				t.Fatalf("unexpected message body: %q", string(msg))
			}
			if auth == nil {
				t.Fatal("expected smtp auth to be created")
			}
			return nil
		}

		err := SendEmail([]string{"support@example.com"}, []byte("Subject: test\n\nHello"))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !called {
			t.Fatal("expected smtp sender to be called")
		}
	})

	t.Run("sender error bubbles up", func(t *testing.T) {
		expectedErr := errors.New("smtp unavailable")
		smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
			return expectedErr
		}

		err := SendEmail([]string{"support@example.com"}, []byte("msg"))
		if err == nil {
			t.Fatal("expected error")
		}
		if !errors.Is(err, expectedErr) {
			t.Fatalf("expected %v, got %v", expectedErr, err)
		}
	})
}
