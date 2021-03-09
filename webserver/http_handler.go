package main

import (
	"net/http"
	"strings"
	"time"
)

type Handler struct{}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/events" {
		eventsHandler(w, r)
	} else if r.URL.Path == "/api/collaboration/realtime_events" {
		realtimeHandler(w, r)
	} else if apiRegexp.MatchString(r.URL.Path) {
		apiHandler.ServeHTTP(w, r)
	} else {
		h.ServeStaticApplication(w, r)
	}
}

func (h Handler) setupPlusPlusSession(userId string, w http.ResponseWriter) {
	sessionID, err := plusPlusSessions.GenerateSessionID()
	if err != nil {
		ErrPrint("Unable to generate a session ID", err)
		return
	}
	session := NewPlusPlusSession(userId)
	plusPlusSessions.Set(sessionID, session)
	http.SetCookie(w, &http.Cookie{
		Name:   "ppsid",
		Value:  sessionID,
		MaxAge: int(PLUS_PLUS_SESSION_VALIDITY.Seconds()),
	})
	eventsManager.Publish("sessions", PlusPlusSessionSync{ID: sessionID, PPS: session})
}

func (h Handler) ServeStaticApplication(w http.ResponseWriter, r *http.Request) {
	// Handle alias if applicable
	if alias, ok := aliasPaths[r.URL.Path]; ok {
		r.URL.Path = alias
	}

	if strings.HasPrefix(r.URL.Path, "/ace.js") {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
	}

	// Present app without ads if applicable and ensure no caching headers are set for this resource
	if r.URL.Path == "/app.html" {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")

		var userId string
		if sessionIdCookie, err := r.Cookie("ppsid"); err == nil {
			sid := sessionIdCookie.Value
			// Make sure there is a session and that it is still valid
			if session := plusPlusSessions.Get(sid); session != nil && session.ValidUntil.After(time.Now()) {
				InfoPrint("Found a valid Plus Plus user session")
				userId = session.GoogleUserId
			}
		}

		// If we have an identifier cookie or if the userId was set above, we enter user validation
		if userIdCookie, err := r.Cookie("current_google_user_id"); err == nil || userId != "" {

			// Don't set the userId if it was already set
			if userId == "" {
				userId = userIdCookie.Value
			}

			if subscription := subscriptions.GetSubscription(userId); subscription != nil {
				if !subscriptions.CanHaveAccess(subscription) {
					InfoPrint(userId, "subscription isn't valid anymore")
				} else {
					InfoPrint(userId, "allowing access to ++ app")
					r.URL.Path = "/app-plus-plus.html"

					// Setup the session for shared accounts if the current user is the one that has the paid version
					if userIdCookie != nil && userIdCookie.Value == userId {
						h.setupPlusPlusSession(userId, w)
					}
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
