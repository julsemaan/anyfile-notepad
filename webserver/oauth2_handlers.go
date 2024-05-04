package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type googleOauth2ConfOptions struct {
	redirectUrl string
}

func getGoogleOauth2Conf(opts googleOauth2ConfOptions) *oauth2.Config {
	var googleOauth2Conf = &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("APP_BASE_URL") + "/api/oauth2/google/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/drive.file",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/drive.install",
			"https://www.googleapis.com/auth/drive.appdata",
		},
		Endpoint: google.Endpoint,
	}
	if opts.redirectUrl != "" {
		googleOauth2Conf.RedirectURL = opts.redirectUrl
	}
	return googleOauth2Conf
}

func handleGoogleOauth2Authorize(c *gin.Context) {
	// Redirect user to Google's consent page to ask for permission
	// for the scopes specified above.
	url := getGoogleOauth2Conf(googleOauth2ConfOptions{redirectUrl: c.Query("redirect_url")}).AuthCodeURL("webserverOauth2")

	if hint := c.Query("login_hint"); hint != "" {
		url += fmt.Sprintf("&login_hint=%s", hint)
	}

	c.Redirect(http.StatusFound, url)
}

func handleGoogleOauth2Callback(c *gin.Context) {
	tok, err := getGoogleOauth2Conf(googleOauth2ConfOptions{}).Exchange(oauth2.NoContext, c.Query("code"))
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to convert authorization code into token: %s", err)})
		return
	}

	//c.JSON(http.StatusOK, tok)
	c.Redirect(http.StatusFound, fmt.Sprintf("/app#google_access_token=%s", tok.AccessToken))
}
