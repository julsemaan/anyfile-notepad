package stats

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
)

type errReader struct{}

func (errReader) Read([]byte) (int, error) {
	return 0, errors.New("read failed")
}

func (errReader) Close() error {
	return nil
}

type metricsStub struct {
	hits int
	keys []string
}

func (s *metricsStub) IncrementStatsHits() {
	s.hits++
}

func (s *metricsStub) IncrementKey(key string) {
	s.keys = append(s.keys, key)
}

func TestParsePayload(t *testing.T) {
	svc := NewService(nil)

	t.Run("uses forwarded for ip", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		req.Header.Set("X-Forwarded-For", "203.0.113.10, 70.41.3.18")

		payload, err := svc.ParsePayload(req)
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}
		if payload["ip"] != "203.0.113.10" {
			t.Fatalf("expected forwarded ip, got %q", payload["ip"])
		}
	})

	t.Run("uses remote addr when header missing", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"hits"}`))
		req.RemoteAddr = "192.0.2.15:43210"

		payload, err := svc.ParsePayload(req)
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}
		if payload["ip"] != "192.0.2.15" {
			t.Fatalf("expected remote ip, got %q", payload["ip"])
		}
	})

	t.Run("invalid json returns error", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"broken":`))
		_, err := svc.ParsePayload(req)
		if !errors.Is(err, ErrInvalidJSON) {
			t.Fatalf("expected ErrInvalidJSON, got %v", err)
		}
	})

	t.Run("json null initializes payload map", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`null`))
		req.RemoteAddr = "192.0.2.15:43210"

		payload, err := svc.ParsePayload(req)
		if err != nil {
			t.Fatalf("unexpected parse error: %v", err)
		}
		if payload["ip"] != "192.0.2.15" {
			t.Fatalf("expected remote ip, got %q", payload["ip"])
		}
	})

	t.Run("too large payload returns error", func(t *testing.T) {
		tooLargeValue := strings.Repeat("a", int(maxPayloadSizeBytes)+32)
		req := httptest.NewRequest(http.MethodPost, "/stats", strings.NewReader(`{"type":"increment","key":"`+tooLargeValue+`"}`))

		_, err := svc.ParsePayload(req)
		if !errors.Is(err, ErrPayloadTooLarge) {
			t.Fatalf("expected ErrPayloadTooLarge, got %v", err)
		}
	})

	t.Run("body read failures return error", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/stats", nil)
		req.Body = io.NopCloser(errReader{})

		_, err := svc.ParsePayload(req)
		if !errors.Is(err, ErrInvalidPayload) {
			t.Fatalf("expected ErrInvalidPayload, got %v", err)
		}
	})
}

func TestRecord(t *testing.T) {
	stub := &metricsStub{}
	svc := NewService(stub)

	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "afn.app.app-load"})

	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}

	expected := []string{"afn.app.app-load"}
	if !reflect.DeepEqual(stub.keys, expected) {
		t.Fatalf("unexpected metrics keys: %#v", stub.keys)
	}

	stub.hits = 0
	stub.keys = nil
	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "afn.app.file-edit.extensions.txt"})
	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}
	expected = []string{"afn.app.file-edit.extension"}
	if !reflect.DeepEqual(stub.keys, expected) {
		t.Fatalf("unexpected metrics keys for extension bucket: %#v", stub.keys)
	}

	stub.hits = 0
	stub.keys = nil
	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "afn.app.some-new-stat"})
	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}
	expected = []string{metricKeyOther}
	if !reflect.DeepEqual(stub.keys, expected) {
		t.Fatalf("unexpected metrics keys for fallback bucket: %#v", stub.keys)
	}

	stub.hits = 0
	stub.keys = nil
	svc.Record(map[string]string{"ip": "2001:db8::1"})
	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}
	if len(stub.keys) != 0 {
		t.Fatalf("did not expect increment key metric, got %#v", stub.keys)
	}

	stub.hits = 0
	stub.keys = nil
	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "bad:key"})
	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}
	if len(stub.keys) != 0 {
		t.Fatalf("expected invalid metric key to be ignored, got %#v", stub.keys)
	}

	stub.hits = 0
	stub.keys = nil
	svc.Record(map[string]string{"ip": "not-an-ip"})
	if stub.hits != 1 {
		t.Fatalf("expected 1 stats hit increment, got %d", stub.hits)
	}
	if len(stub.keys) != 0 {
		t.Fatalf("did not expect increment key metric, got %#v", stub.keys)
	}
}
