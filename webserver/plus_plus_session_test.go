package main

import (
	"path/filepath"
	"regexp"
	"testing"
	"time"
)

func TestGenerateSessionID(t *testing.T) {
	pps := NewPlusPlusSessions()

	sid, err := pps.GenerateSessionID()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sid) != 64 {
		t.Fatalf("expected 64-char token, got %d", len(sid))
	}
	if !regexp.MustCompile("^[a-f0-9]+$").MatchString(sid) {
		t.Fatalf("expected hex token, got %q", sid)
	}
}

func TestSetGetAndMaintenance(t *testing.T) {
	pps := NewPlusPlusSessions()
	pps.Set("valid", &PlusPlusSession{GoogleUserId: "u1", ValidUntil: time.Now().Add(time.Hour)})
	pps.Set("expired", &PlusPlusSession{GoogleUserId: "u2", ValidUntil: time.Now().Add(-time.Hour)})

	if pps.Get("valid") == nil {
		t.Fatal("expected valid session to exist")
	}
	if pps.Get("expired") == nil {
		t.Fatal("expected expired session to exist before maintenance")
	}

	pps.Maintenance()

	if pps.Get("expired") != nil {
		t.Fatal("expected expired session to be removed")
	}
	if pps.Get("valid") == nil {
		t.Fatal("expected valid session to stay")
	}
}

func TestSaveAndRestoreFromFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "sessions.json")

	initial := NewPlusPlusSessions()
	initial.Set("sid", &PlusPlusSession{GoogleUserId: "user-123", ValidUntil: time.Now().Add(2 * time.Hour)})

	if err := initial.SaveToFile(path); err != nil {
		t.Fatalf("save failed: %v", err)
	}

	restored := NewPlusPlusSessions()
	if err := restored.RestoreFromFile(path); err != nil {
		t.Fatalf("restore failed: %v", err)
	}

	s := restored.Get("sid")
	if s == nil {
		t.Fatal("expected restored session")
	}
	if s.GoogleUserId != "user-123" {
		t.Fatalf("unexpected restored user id: %q", s.GoogleUserId)
	}
}
