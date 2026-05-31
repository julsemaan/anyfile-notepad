package logging

import (
	"bytes"
	"errors"
	"log"
	"os"
	"os/exec"
	"strings"
	"testing"
)

func captureLogOutput(t *testing.T) *bytes.Buffer {
	t.Helper()

	buf := &bytes.Buffer{}
	originalWriter := log.Writer()
	originalFlags := log.Flags()
	originalPrefix := log.Prefix()

	log.SetOutput(buf)
	log.SetFlags(0)
	log.SetPrefix("")

	t.Cleanup(func() {
		log.SetOutput(originalWriter)
		log.SetFlags(originalFlags)
		log.SetPrefix(originalPrefix)
	})

	return buf
}

func TestErrorAddsPrefix(t *testing.T) {
	buf := captureLogOutput(t)

	Error("unable to send email", 42)

	if got := buf.String(); !strings.Contains(got, "ERROR: unable to send email 42") {
		t.Fatalf("expected ERROR prefix in output, got %q", got)
	}
}

func TestErrorfAddsPrefix(t *testing.T) {
	buf := captureLogOutput(t)

	Errorf("unable to send email %d", 42)

	if got := buf.String(); !strings.Contains(got, "ERROR: unable to send email 42") {
		t.Fatalf("expected ERROR prefix in output, got %q", got)
	}
}

func TestFatalfAddsPrefixAndExits(t *testing.T) {
	if os.Getenv("LOGGING_FATALF_TEST") == "1" {
		log.SetOutput(os.Stderr)
		log.SetFlags(0)
		log.SetPrefix("")
		Fatalf("unable to send email %d", 42)
		return
	}

	cmd := exec.Command(os.Args[0], "-test.run=TestFatalfAddsPrefixAndExits")
	cmd.Env = append(os.Environ(), "LOGGING_FATALF_TEST=1")

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	err := cmd.Run()
	var exitErr *exec.ExitError
	if !errors.As(err, &exitErr) {
		t.Fatalf("expected process exit error, got %v", err)
	}
	if exitErr.ExitCode() != 1 {
		t.Fatalf("expected exit code 1, got %d", exitErr.ExitCode())
	}

	if got := stderr.String(); !strings.Contains(got, "ERROR: unable to send email 42") {
		t.Fatalf("expected ERROR prefix in fatal output, got %q", got)
	}
}
