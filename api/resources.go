package main

import (
	"os"

	filestore "github.com/julsemaan/rest-layer-file"
	"github.com/rs/rest-layer/resource"
	"github.com/rs/rest-layer/schema"
)

func getDataDirectory() string {
	directory := os.Getenv("AFN_REST_DATA_DIR")
	if directory == "" {
		return "./db"
	}
	return directory
}

func buildResourceIndex(directory string) resource.Index {
	index := resource.NewIndex()

	index.Bind("mime_types", mimeTypeSchema(), filestore.NewHandler(directory, "mime_types", []string{"type_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("extensions", extensionSchema(), filestore.NewHandler(directory, "extensions", []string{"name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("syntaxes", syntaxSchema(), filestore.NewHandler(directory, "syntaxes", []string{"ace_js_mode", "display_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind("settings", settingSchema(), filestore.NewHandler(directory, "settings", []string{"var_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	contactRequests := index.Bind("contact_requests", contactRequestSchema(), filestore.NewHandler(directory, "contact_requests", []string{"id"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})
	contactRequests.Use(resource.InsertEventHandlerFunc(insertContactRequestHook))
	contactRequests.Use(resource.InsertedEventHandlerFunc(insertedContactRequestHook))

	return index
}

func mimeTypeSchema() schema.Schema {
	return schema.Schema{
		Description: "The mime_type object",
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
}

func extensionSchema() schema.Schema {
	return schema.Schema{
		Description: "Represents an extension",
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
}

func syntaxSchema() schema.Schema {
	return schema.Schema{
		Description: "Represents a syntax",
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
}

func settingSchema() schema.Schema {
	return schema.Schema{
		Description: "Represents a setting",
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
}
