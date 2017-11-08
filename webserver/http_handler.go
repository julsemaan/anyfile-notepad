package main

import (
	"fmt"
	"net/http"
)

type Handler struct{}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if apiRegexp.MatchString(r.URL.Path) {
		apiHandler.ServeHTTP(w, r)
	} else {
		h.ServeStaticApplication(w, r)
	}
}

func (h Handler) ServeStaticApplication(w http.ResponseWriter, r *http.Request) {
	// Handle alias if applicable
	if alias, ok := aliasPaths[r.URL.Path]; ok {
		r.URL.Path = alias
	}

	// Present app without ads if applicable and ensure no caching headers are set for this resource
	if r.URL.Path == "/app.html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		if userIdCookie, err := r.Cookie("current_google_user_id"); err == nil {
			userId := userIdCookie.Value
			if subscription := subscriptions.GetSubscription(userId); subscription != nil {
				if subscription.Status != "active" {
					fmt.Println(userId, "subscription isn't active anymore")
				} else {
					fmt.Println(userId, "allowing access to ++ app")
					r.URL.Path = "/app-plus-plus.html"
				}
			}
		}
	}

	// Check if we should send to prod or dev backend
	var appHandler http.Handler = appProdHandler
	if devCookie, err := r.Cookie("AFNVersion"); err == nil && devCookie.Value == "dev" {
		appHandler = appDevHandler
	}

	appHandler.ServeHTTP(w, r)
}
