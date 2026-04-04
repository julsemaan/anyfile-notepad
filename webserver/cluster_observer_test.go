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

func TestClusterObserverGlpclientUsesBasicAuthEnv(t *testing.T) {
	t.Setenv("CLUSTER_OBSERVER_USERNAME", "observer-user")
	t.Setenv("CLUSTER_OBSERVER_PASSWORD", "observer-pass")

	observer := NewClusterObserver([]string{"http://node1:8000"})
	client := observer.glpclient("http://node1:8000", "reload")
	if client == nil {
		t.Fatal("expected glpclient instance")
	}
	if client.BasicAuthUsername != "observer-user" {
		t.Fatalf("unexpected basic auth username: %q", client.BasicAuthUsername)
	}
	if client.BasicAuthPassword != "observer-pass" {
		t.Fatalf("unexpected basic auth password: %q", client.BasicAuthPassword)
	}
}
