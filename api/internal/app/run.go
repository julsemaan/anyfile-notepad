package app

import (
	"log"
	"net/http"
	"time"

	"github.com/julsemaan/anyfile-notepad/api/internal/contact"
	"github.com/julsemaan/anyfile-notepad/api/internal/httpapi"
	"github.com/julsemaan/anyfile-notepad/api/internal/resources"
	"github.com/julsemaan/anyfile-notepad/api/internal/stats"
	"github.com/julsemaan/anyfile-notepad/utils"
	cache "github.com/patrickmn/go-cache"
	"github.com/rs/rest-layer/resource"
	"github.com/rs/rest-layer/rest"
	"github.com/rs/rest-layer/schema"
	"gopkg.in/alexcesaro/statsd.v2"
)

func Run(cfg Config) error {
	schema.CreatedField.ReadOnly = false
	schema.UpdatedField.ReadOnly = false

	statsConn, err := statsd.New(statsd.Address(cfg.StatsdAddress))
	if err != nil {
		log.Printf("warning: statsd initialization failed: %v", err)
	}
	if statsConn != nil {
		defer statsConn.Close()
	}

	statsService := stats.NewService(statsConn)
	contactCache := cache.New(24*time.Hour, time.Minute)
	contactService := contact.NewService(contactCache, cfg.MaxContactRequestsPerDay, cfg.SupportEmail, utils.SendEmail)

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

	log.Printf("Serving API on http://localhost%s", cfg.ListenAddr)
	return http.ListenAndServe(cfg.ListenAddr, router)
}
