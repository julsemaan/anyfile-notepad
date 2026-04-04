package main

import "testing"

func TestEmailExtractionRegex(t *testing.T) {
	match := reEmailFromDesc.FindAllStringSubmatch("Customer for Google email: user@example.com", -1)
	if len(match) != 1 || len(match[0]) < 2 {
		t.Fatalf("expected one regex match, got %#v", match)
	}
	if match[0][1] != "user@example.com" {
		t.Fatalf("unexpected extracted email: %s", match[0][1])
	}

	none := reEmailFromDesc.FindAllStringSubmatch("No email here", -1)
	if len(none) != 0 {
		t.Fatalf("expected no match, got %#v", none)
	}
}
