package httpapi

import (
	"net/http"
	"regexp"
)

var pathStatsRE = regexp.MustCompile(`^/stats(?:/|$)`)

func NewRouter(apiHandler http.Handler, statsHandler http.Handler, username string, password string) http.Handler {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if pathStatsRE.MatchString(r.URL.Path) {
			statsHandler.ServeHTTP(w, r)
			return
		}

		if !IsOpenResource(r) && !Authenticate(w, r, username, password) {
			return
		}

		apiHandler.ServeHTTP(w, r)
	})

	return withAccessLog(withCORS(handler))
}
