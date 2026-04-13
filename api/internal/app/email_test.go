package app

import (
	"errors"
	"net/smtp"
	"testing"
)

func TestSendEmailWithOptionalTLS(t *testing.T) {
	t.Setenv("SMTP_USER", "smtp-user")
	t.Setenv("SMTP_PASSWORD", "smtp-pass")
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_PORT", "2525")
	t.Setenv("SMTP_FROM", "noreply@example.com")

	originalSender := smtpSendMail
	originalSenderWithTLSConfig := smtpSendMailWithTLSConfig
	t.Cleanup(func() {
		smtpSendMail = originalSender
		smtpSendMailWithTLSConfig = originalSenderWithTLSConfig
	})

	t.Run("successful send with default sender", func(t *testing.T) {
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

		err := sendEmailWithOptionalTLS([]string{"support@example.com"}, []byte("Subject: test\n\nHello"))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !called {
			t.Fatal("expected smtp sender to be called")
		}
	})

	t.Run("empty credentials disable smtp auth", func(t *testing.T) {
		t.Setenv("SMTP_USER", "")
		t.Setenv("SMTP_PASSWORD", "")

		smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
			if auth != nil {
				t.Fatal("expected smtp auth to be nil")
			}
			return nil
		}

		err := sendEmailWithOptionalTLS([]string{"support@example.com"}, []byte("msg"))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("sender error bubbles up", func(t *testing.T) {
		expectedErr := errors.New("smtp unavailable")
		smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
			return expectedErr
		}

		err := sendEmailWithOptionalTLS([]string{"support@example.com"}, []byte("msg"))
		if err == nil {
			t.Fatal("expected error")
		}
		if !errors.Is(err, expectedErr) {
			t.Fatalf("expected %v, got %v", expectedErr, err)
		}
	})

	t.Run("quoted true enables tls skip verify sender", func(t *testing.T) {
		t.Setenv("SMTP_SKIP_TLS_VERIFY", "'true'")

		normalSenderCalled := false
		smtpSendMail = func(addr string, auth smtp.Auth, from string, to []string, msg []byte) error {
			normalSenderCalled = true
			return nil
		}

		customSenderCalled := false
		smtpSendMailWithTLSConfig = func(addr string, host string, from string, to []string, msg []byte, auth smtp.Auth, skipTLSVerify bool) error {
			customSenderCalled = true
			if addr != "smtp.example.com:2525" {
				t.Fatalf("unexpected smtp addr: %s", addr)
			}
			if host != "smtp.example.com" {
				t.Fatalf("unexpected smtp host: %s", host)
			}
			if !skipTLSVerify {
				t.Fatal("expected skipTLSVerify to be true")
			}
			return nil
		}

		err := sendEmailWithOptionalTLS([]string{"support@example.com"}, []byte("msg"))
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !customSenderCalled {
			t.Fatal("expected custom tls sender to be called")
		}
		if normalSenderCalled {
			t.Fatal("did not expect normal sender to be called")
		}
	})
}
