package stats

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"regexp"
	"strings"
)

var ErrInvalidPayload = errors.New("invalid payload")
var ErrInvalidJSON = errors.New("invalid json")

var remoteAddrRegex = regexp.MustCompile(`^([0-9.]+):`)

type Metrics interface {
	Increment(bucket string)
}

type Service struct {
	metrics Metrics
}

func NewService(metrics Metrics) *Service {
	return &Service{metrics: metrics}
}

func (s *Service) ParsePayload(r *http.Request) (map[string]string, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, ErrInvalidPayload
	}

	var payload map[string]string
	decoder := json.NewDecoder(bytes.NewBuffer(body))
	if err := decoder.Decode(&payload); err != nil {
		return nil, ErrInvalidJSON
	}
	if payload == nil {
		payload = map[string]string{}
	}

	payload["ip"] = extractIP(r)
	return payload, nil
}

func (s *Service) Record(payload map[string]string) {
	if s.metrics == nil {
		return
	}

	ipKey := strings.NewReplacer(".", "_", ":", "_").Replace(payload["ip"])
	s.metrics.Increment("afn.stats-hits." + ipKey)

	if payload["type"] == "increment" {
		s.metrics.Increment(payload["key"])
	}
}

func extractIP(r *http.Request) string {
	forwardedFor := r.Header.Get("X-Forwarded-For")
	if forwardedFor != "" {
		return strings.TrimSpace(strings.Split(forwardedFor, ",")[0])
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}

	matches := remoteAddrRegex.FindAllStringSubmatch(r.RemoteAddr, 1)
	if len(matches) > 0 && len(matches[0]) > 1 {
		return matches[0][1]
	}

	return r.RemoteAddr
}
