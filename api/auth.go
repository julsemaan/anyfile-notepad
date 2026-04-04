package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

func newRootHandler(api http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		setCORSHeaders(w)

		if strings.HasPrefix(r.URL.Path, "/stats") {
			handleStats(w, r)
			return
		}

		if !isOpenResource(r) && !authenticate(w, r) {
			return
		}

		api.ServeHTTP(w, r)
	}
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func isOpenResource(r *http.Request) bool {
	if r.Method == http.MethodOptions {
		return true
	}

	if strings.HasPrefix(r.URL.Path, "/contact_requests") {
		if r.Method == http.MethodPost {
			log.Print("Allowing without authentication for creating a contact request")
			return true
		}
		return false
	}

	if r.Method == http.MethodGet {
		log.Print("Allowing without authentication for namespace that don't modify resources")
		return true
	}

	return false
}

func authenticate(w http.ResponseWriter, r *http.Request) bool {
	username, password, ok := r.BasicAuth()
	if !ok || username != os.Getenv("AFN_REST_USERNAME") || password != os.Getenv("AFN_REST_PASSWORD") {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte("Unauthorized"))
		return false
	}

	return true
}
