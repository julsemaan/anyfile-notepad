package main

import "testing"

func TestNewClusterObserverAndHostURL(t *testing.T) {
	observer := NewClusterObserver([]string{"http://node1:8000", "https://node2"})
	if len(observer.Hosts) != 2 {
		t.Fatalf("expected 2 hosts, got %d", len(observer.Hosts))
	}

	u := observer.hostURL("http://node1:8000")
	if u == nil {
		t.Fatal("expected URL")
	}
	if u.String() != "http://node1:8000/events" {
		t.Fatalf("unexpected URL: %s", u.String())
	}
}
