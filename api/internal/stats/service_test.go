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
	keys []string
}

func (s *metricsStub) Increment(bucket string) {
	s.keys = append(s.keys, bucket)
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

	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "hits"})

	expected := []string{"afn.stats-hits.192_0_2_15", "hits"}
	if !reflect.DeepEqual(stub.keys, expected) {
		t.Fatalf("unexpected metrics keys: %#v", stub.keys)
	}

	stub.keys = nil
	svc.Record(map[string]string{"ip": "2001:db8::1"})
	if len(stub.keys) != 1 || stub.keys[0] != "afn.stats-hits.2001_db8__1" {
		t.Fatalf("expected sanitized ipv6 metric key, got %#v", stub.keys)
	}

	stub.keys = nil
	svc.Record(map[string]string{"ip": "192.0.2.15", "type": "increment", "key": "bad:key"})
	if len(stub.keys) != 1 || stub.keys[0] != "afn.stats-hits.192_0_2_15" {
		t.Fatalf("expected invalid metric key to be ignored, got %#v", stub.keys)
	}
}
