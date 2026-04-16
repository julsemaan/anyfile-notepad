package app

import (
	"log"
	"net/http"
	"time"

	"github.com/julsemaan/anyfile-notepad/api/internal/contact"
	"github.com/julsemaan/anyfile-notepad/api/internal/httpapi"
	"github.com/julsemaan/anyfile-notepad/api/internal/resources"
	"github.com/julsemaan/anyfile-notepad/api/internal/stats"
	cache "github.com/patrickmn/go-cache"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/rest-layer/resource"
	"github.com/rs/rest-layer/rest"
	"github.com/rs/rest-layer/schema"
)

func Run(cfg Config) error {
	schema.CreatedField.ReadOnly = false
	schema.UpdatedField.ReadOnly = false

	metrics := stats.NewPrometheusMetrics()
	statsService := stats.NewService(metrics)
	contactCache := cache.New(24*time.Hour, time.Minute)
	contactService := contact.NewService(contactCache, cfg.MaxContactRequestsPerDay, cfg.SupportEmail, sendEmailWithOptionalTLS)

	index := resources.BuildIndex(cfg.DataDir, resources.ContactHooks{
		Insert:   resource.InsertEventHandlerFunc(contactService.BeforeInsert),
		Inserted: resource.InsertedEventHandlerFunc(contactService.AfterInsert),
	})

	restHandler, err := rest.NewHandler(index)
	if err != nil {
		return err
	}

	router := httpapi.NewRouter(
		restHandler,
		httpapi.NewStatsHandler(statsService),
		promhttp.Handler(),
		cfg.Username,
		cfg.Password,
	)

	log.Printf("Serving API on http://localhost%s", cfg.ListenAddr)
	return http.ListenAndServe(cfg.ListenAddr, router)
}
