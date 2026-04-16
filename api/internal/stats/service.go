package stats

import (
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
var ErrPayloadTooLarge = errors.New("payload too large")

const maxPayloadSizeBytes = 4 * 1024

var remoteAddrRegex = regexp.MustCompile(`^([0-9.]+):`)
var metricKeyRegex = regexp.MustCompile(`^[a-zA-Z0-9_.-]{1,64}$`)

type Metrics interface {
	IncrementStatsHits()
	IncrementKey(key string)
}

type Service struct {
	metrics Metrics
}

func NewService(metrics Metrics) *Service {
	return &Service{metrics: metrics}
}

func (s *Service) ParsePayload(r *http.Request) (map[string]string, error) {
	limitedBody := &io.LimitedReader{R: r.Body, N: maxPayloadSizeBytes + 1}
	var payload map[string]string
	decoder := json.NewDecoder(limitedBody)
	if err := decoder.Decode(&payload); err != nil {
		if limitedBody.N <= 0 {
			return nil, ErrPayloadTooLarge
		}

		var syntaxErr *json.SyntaxError
		var unmarshalTypeErr *json.UnmarshalTypeError
		if errors.As(err, &syntaxErr) || errors.As(err, &unmarshalTypeErr) || errors.Is(err, io.ErrUnexpectedEOF) || errors.Is(err, io.EOF) {
			return nil, ErrInvalidJSON
		}
		return nil, ErrInvalidPayload
	}

	if limitedBody.N <= 0 {
		return nil, ErrPayloadTooLarge
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
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

	s.metrics.IncrementStatsHits()

	if payload["type"] == "increment" {
		if metricKeyRegex.MatchString(payload["key"]) {
			s.metrics.IncrementKey(payload["key"])
		}
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
