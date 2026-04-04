package httpapi

import (
	"log"
	"net/http"
	"strings"
)

func IsOpenResource(r *http.Request) bool {
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

func Authenticate(w http.ResponseWriter, r *http.Request, username string, password string) bool {
	requestUsername, requestPassword, ok := r.BasicAuth()
	if !ok || requestUsername != username || requestPassword != password {
		w.Header().Set("WWW-Authenticate", `Basic realm="restricted"`)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte("Unauthorized"))
		return false
	}
	return true
}
