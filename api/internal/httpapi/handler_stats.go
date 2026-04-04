package httpapi

import (
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/julsemaan/anyfile-notepad/api/internal/stats"
)

type StatsService interface {
	ParsePayload(r *http.Request) (map[string]string, error)
	Record(payload map[string]string)
}

func NewStatsHandler(statsService StatsService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Print("Allowing without authentication for stats namespace")

		payload, err := statsService.ParsePayload(r)
		if err != nil {
			switch {
			case errors.Is(err, stats.ErrInvalidPayload):
				http.Error(w, "Invalid payload", http.StatusBadRequest)
			case errors.Is(err, stats.ErrInvalidJSON):
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
			default:
				http.Error(w, "Invalid payload", http.StatusBadRequest)
			}
			return
		}

		statsService.Record(payload)
		log.Printf("Stats request from %q", payload["ip"])
		if payload["type"] == "increment" {
			log.Printf("afn.stats-hits.%q from %q", payload["key"], payload["ip"])
		}

		_, _ = w.Write([]byte(fmt.Sprint("OK")))
	})
}
