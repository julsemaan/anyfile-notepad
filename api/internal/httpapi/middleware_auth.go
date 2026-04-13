package httpapi

import (
	"crypto/subtle"
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
		return true
	}

	return false
}

func Authenticate(w http.ResponseWriter, r *http.Request, username string, password string) bool {
	if username == "" || password == "" {
		w.Header().Set("WWW-Authenticate", `Basic realm="restricted"`)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte("Unauthorized"))
		return false
	}

	requestUsername, requestPassword, ok := r.BasicAuth()
	validUsername := subtle.ConstantTimeCompare([]byte(requestUsername), []byte(username)) == 1
	validPassword := subtle.ConstantTimeCompare([]byte(requestPassword), []byte(password)) == 1
	if !ok || !validUsername || !validPassword {
		w.Header().Set("WWW-Authenticate", `Basic realm="restricted"`)
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte("Unauthorized"))
		return false
	}
	return true
}
