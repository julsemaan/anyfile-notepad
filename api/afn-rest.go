package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"text/template"

	"github.com/davecgh/go-spew/spew"
	"github.com/julsemaan/anyfile-notepad/utils"
	"github.com/julsemaan/rest-layer-file"
	"github.com/rs/rest-layer/resource"
	"github.com/rs/rest-layer/rest"
	"github.com/rs/rest-layer/schema"
	"gopkg.in/alexcesaro/statsd.v2"
)

var statsdConn, _ = statsd.New(statsd.Address(os.Getenv("AFN_STATSD_URI")))

func main() {
	defer statsdConn.Close()

	schema.CreatedField.ReadOnly = false
	schema.UpdatedField.ReadOnly = false

	var (
		mime_type = schema.Schema{
			Description: `The mime_type object`,
			Fields: schema.Fields{
				"id":         schema.IDField,
				"created_at": schema.CreatedField,
				"updated_at": schema.UpdatedField,
				"type_name": {
					Required:   true,
					Filterable: true,
				},
				"integrated": {
					Default:    false,
					Filterable: true,
					Validator:  &schema.Bool{},
				},
				"discovered_by": {
					Default:    "John Doe",
					Filterable: true,
				},
			},
		}

		extension = schema.Schema{
			Description: `Represents an extension`,
			Fields: schema.Fields{
				"id":         schema.IDField,
				"created_at": schema.CreatedField,
				"updated_at": schema.UpdatedField,
				"name": {
					Required:   true,
					Filterable: true,
				},
				"syntax_id": {
					Required:   true,
					Filterable: true,
					Validator: &schema.Reference{
						Path: "syntaxes",
					},
				},
				"mime_type_id": {
					Required:   true,
					Filterable: true,
					Validator: &schema.Reference{
						Path: "mime_types",
					},
				},
			},
		}

		syntax = schema.Schema{
			Description: `Represents a syntax`,
			Fields: schema.Fields{
				"id":         schema.IDField,
				"created_at": schema.CreatedField,
				"updated_at": schema.UpdatedField,
				"display_name": {
					Required:   true,
					Filterable: true,
				},
				"ace_js_mode": {
					Required:   true,
					Filterable: true,
				},
			},
		}

		setting = schema.Schema{
			Description: `Represents a setting`,
			Fields: schema.Fields{
				"id":         schema.IDField,
				"created_at": schema.CreatedField,
				"updated_at": schema.UpdatedField,
				"var_name": {
					Required:   true,
					Filterable: true,
				},
				"value": {
					Required:   true,
					Filterable: true,
				},
			},
		}

		contactRequest = schema.Schema{
			Description: "Represents a contact request",
			Fields: schema.Fields{
				"id":         schema.IDField,
				"created_at": schema.CreatedField,
				"updated_at": schema.UpdatedField,
				"contact_email": {
					Required:   true,
					Filterable: true,
					Validator:  &emailValidator{},
				},
				"message": {
					Required:   true,
					Filterable: true,
				},
			},
		}
	)

	// Create a REST API resource index
	index := resource.NewIndex()

	directory := os.Getenv("AFN_REST_DATA_DIR")
	if directory == "" {
		directory = "./db"
	}

	index.Bind("mime_types", mime_type, filestore.NewHandler(directory, "mime_types", []string{"type_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("extensions", extension, filestore.NewHandler(directory, "extensions", []string{"name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("syntaxes", syntax, filestore.NewHandler(directory, "syntaxes", []string{"ace_js_mode", "display_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("settings", setting, filestore.NewHandler(directory, "settings", []string{"var_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	contactRequests := index.Bind("contact_requests", contactRequest, filestore.NewHandler(directory, "contact_requests", []string{"id"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})
	contactRequests.Use(resource.InsertedEventHandlerFunc(insertedContactRequestHook))

	// Create API HTTP handler for the resource graph
	api, err := rest.NewHandler(index)
	if err != nil {
		log.Fatalf("Invalid API configuration: %s", err)
	}

	// Bind the API under /api/ path
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if matched, _ := regexp.MatchString("^/stats", r.URL.Path); matched {
			log.Print("Allowing without authentication for stats namespace")
			if statsRequest, err := parseStatsPayload(w, r); err == nil {
				statsdConn.Increment(fmt.Sprintf("afn.stats-hits.%s", strings.Replace(statsRequest["ip"], ".", "_", -1)))
				log.Printf("Stats request from %s", statsRequest["ip"])
				switch statsRequest["type"] {
				case "increment":
					log.Printf("Incrementing %s", statsRequest["key"])
					statsdConn.Increment(statsRequest["key"])
				}
				w.Write([]byte("OK"))
				return
			} else {
				return
			}
		} else if isOpenResource(r) {
			// pass
		} else if !authenticate(w, r) {
			return
		}
		api.ServeHTTP(w, r)
	})

	// Serve it
	log.Print("Serving API on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func parseStatsPayload(w http.ResponseWriter, r *http.Request) (map[string]string, error) {
	buf, _ := ioutil.ReadAll(r.Body)
	dec := json.NewDecoder(bytes.NewBuffer(buf))
	var s map[string]string
	err := dec.Decode(&s)
	if err != nil {
		panic(err)
	}
	if r.Header.Get("X-Forwarded-For") != "" {
		s["ip"] = strings.Split(r.Header.Get("X-Forwarded-For"), ",")[0]
	} else {
		re := regexp.MustCompile("^([0-9.]+):")
		s["ip"] = re.FindAllStringSubmatch(r.RemoteAddr, 1)[0][1]
	}
	return s, nil
}

func isOpenResource(r *http.Request) bool {
	if r.Method == "OPTIONS" {
		return true
	}

	if strings.HasPrefix(r.URL.Path, "/contact_requests") {
		if r.Method == "POST" {
			log.Print("Allowing without authentication for creating a contact request")
			return true
		} else {
			return false
		}
	}

	if r.Method == "GET" {
		log.Print("Allowing without authentication for namespace that don't modify resources")
		return true
	}

	return false
}

func authenticate(w http.ResponseWriter, r *http.Request) bool {
	username, password, ok := r.BasicAuth()
	if !ok || username != os.Getenv("AFN_REST_USERNAME") || password != os.Getenv("AFN_REST_PASSWORD") {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte("Unauthorized"))
		return false
	}
	return true
}

func insertedContactRequestHook(ctx context.Context, items []*resource.Item, err *error) {
	spew.Dump(items)
	emails := []string{os.Getenv("AFN_SUPPORT_EMAIL")}
	for _, item := range items {
		msgTemplate, _ := template.New("contact-email").Parse(`Subject: Anyfile Notepad - Message from {{.ReplyTo}}
To: {{.Emails}}
Reply-To: {{.ReplyTo}}

{{.Message}}
`)
		var msgBytes bytes.Buffer
		msgTemplate.Execute(&msgBytes, struct {
			Emails  string
			Message string
			ReplyTo string
		}{
			Emails:  strings.Join(emails, ";"),
			Message: item.Payload["message"].(string),
			ReplyTo: item.Payload["contact_email"].(string),
		})
		msg, _ := ioutil.ReadAll(&msgBytes)
		utils.SendEmail(emails, msg)
	}

}

type emailValidator struct {
}

func (emailValidator) Validate(value interface{}) (interface{}, error) {
	email := value.(string)
	if res, _ := regexp.MatchString(`\S+@\S+`, email); !res {
		return email, errors.New("Invalid email format")
	} else {
		return email, nil
	}
}
