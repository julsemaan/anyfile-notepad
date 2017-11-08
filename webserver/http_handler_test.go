package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func init() {
	cwd, _ := os.Getwd()
	os.Setenv("AFN_PROD_APP_PATH", cwd+"/testapp/")
	os.Setenv("AFN_DEV_APP_PATH", cwd+"/testapp/dev")
}

func TestHTTPHandler(t *testing.T) {
	setup()
	// testing aliases
	testGetStaticResource(t, "/app", http.StatusOK, "app.html\n", false)
	testGetStaticResource(t, "/app.html", http.StatusOK, "app.html\n", false)
	testGetStaticResource(t, "/news.html", http.StatusOK, "site/news.html\n", false)
	testGetStaticResource(t, "/faq.html", http.StatusOK, "site/faq.html\n", false)

	// Testing potential bypadd
	testGetStaticResource(t, "/app-plus-plus.html", http.StatusOK, "app.html\n", false)

	// Testing dev mode
	testGetStaticResource(t, "/app", http.StatusOK, "dev/app.html\n", true)
}

func testGetStaticResource(t *testing.T, path string, expectedCode int, expectedBody string, devMode bool) {
	h := Handler{}

	req, _ := http.NewRequest("GET", path, nil)

	if devMode {
		req.AddCookie(&http.Cookie{Name: "AFNVersion", Value: "dev"})
	}

	recorder := httptest.NewRecorder()
	h.ServeHTTP(recorder, req)
	resp := recorder.Result()

	if resp.StatusCode != expectedCode || recorder.Body.String() != expectedBody {
		t.Error("Something went wrong while testing", path, "got status code", resp.StatusCode, "and body", recorder.Body.String())
	}
}
