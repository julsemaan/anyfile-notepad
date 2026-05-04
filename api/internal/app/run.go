package app

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/julsemaan/anyfile-notepad/api/internal/contact"
	"github.com/julsemaan/anyfile-notepad/api/internal/httpapi"
	"github.com/julsemaan/anyfile-notepad/api/internal/logging"
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
		cfg.Username,
		cfg.Password,
	)

	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.Handler())

	metricsServer := &http.Server{
		Addr:              cfg.MetricsListenAddr,
		Handler:           metricsMux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	apiServer := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go serveMetrics(metricsServer, cfg.MetricsListenAddr)

	return serveAPI(apiServer, cfg.ListenAddr)
}

type listenAndServer interface {
	ListenAndServe() error
}

func serveMetrics(server listenAndServer, addr string) {
	log.Printf("Serving Prometheus metrics on %s", logURL(addr, "/metrics"))

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logging.Errorf("Prometheus metrics server stopped: %v", err)
	}
}

func serveAPI(server listenAndServer, addr string) error {
	log.Printf("Serving API on %s", logURL(addr, ""))

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return nil
}

func logURL(addr string, path string) string {
	if strings.HasPrefix(addr, ":") {
		addr = "localhost" + addr
	}

	return "http://" + addr + path
}
