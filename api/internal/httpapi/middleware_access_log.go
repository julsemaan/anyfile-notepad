package httpapi

import (
	"log"
	"net/http"
	"time"
)

type accessLogResponseWriter struct {
	http.ResponseWriter
	status int
}

func (w *accessLogResponseWriter) WriteHeader(statusCode int) {
	w.status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func withAccessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		wrappedWriter := &accessLogResponseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(wrappedWriter, r)

		log.Printf(
			"access method=%s path=%s status=%d duration=%s",
			r.Method,
			r.URL.Path,
			wrappedWriter.status,
			time.Since(startedAt).Round(time.Millisecond),
		)
	})
}
