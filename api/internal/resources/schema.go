package resources

import (
	"errors"
	"regexp"

	"github.com/rs/rest-layer/schema"
)

const MimeTypesCollection = "mime_types"
const ExtensionsCollection = "extensions"
const SyntaxesCollection = "syntaxes"
const SettingsCollection = "settings"
const ContactRequestsCollection = "contact_requests"

var emailRegex = regexp.MustCompile(`\S+@\S+`)

func MimeTypeSchema() schema.Schema {
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

func ExtensionSchema() schema.Schema {
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
					Path: SyntaxesCollection,
				},
			},
			"mime_type_id": {
				Required:   true,
				Filterable: true,
				Validator: &schema.Reference{
					Path: MimeTypesCollection,
				},
			},
		},
	}
}

func SyntaxSchema() schema.Schema {
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

func SettingSchema() schema.Schema {
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

func ContactRequestSchema() schema.Schema {
	return schema.Schema{
		Description: "Represents a contact request",
		Fields: schema.Fields{
			"id":         schema.IDField,
			"created_at": schema.CreatedField,
			"updated_at": schema.UpdatedField,
			"contact_email": {
				Required:   true,
				Filterable: true,
				Validator:  emailValidator{},
			},
			"message": {
				Required:   true,
				Filterable: true,
				Validator: &schema.String{
					MinLen: 10,
					MaxLen: 2000,
				},
			},
		},
	}
}

type emailValidator struct{}

func (emailValidator) Validate(value interface{}) (interface{}, error) {
	email, ok := value.(string)
	if !ok {
		return value, errors.New("Invalid email format")
	}
	if !emailRegex.MatchString(email) {
		return email, errors.New("Invalid email format")
	}
	return email, nil
}
