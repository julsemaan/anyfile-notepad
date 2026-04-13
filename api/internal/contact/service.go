package contact

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"text/template"

	"github.com/rs/rest-layer/resource"
)

var errTooManyRequests = errors.New("too many contact requests, try again later")
var errUnableToSendEmail = errors.New("unable to process contact request, please try again later")

var messageTemplate = template.Must(template.New("contact-email").Parse(`Subject: Anyfile Notepad - Message from {{.ReplyTo}}
To: {{.Emails}}
Reply-To: {{.ReplyTo}}

{{.Message}}
`))

type Cache interface {
	ItemCount() int
	SetDefault(key string, value interface{})
}

type Sender func(to []string, msg []byte) error

type Service struct {
	cache        Cache
	maxPerDay    int
	supportEmail string
	sendEmail    Sender
}

func NewService(cache Cache, maxPerDay int, supportEmail string, sendEmail Sender) *Service {
	return &Service{
		cache:        cache,
		maxPerDay:    maxPerDay,
		supportEmail: supportEmail,
		sendEmail:    sendEmail,
	}
}

func (s *Service) BeforeInsert(_ context.Context, items []*resource.Item) error {
	if s.cache != nil && s.cache.ItemCount()+len(items) > s.maxPerDay {
		return errTooManyRequests
	}

	if s.sendEmail == nil || s.supportEmail == "" {
		return nil
	}

	recipients := []string{s.supportEmail}
	for _, item := range items {
		msg, buildErr := buildMessage(recipients, item)
		if buildErr != nil {
			log.Printf("ERROR: Unable to build contact request email: %v", buildErr)
			return errUnableToSendEmail
		}
		if sendErr := s.sendEmail(recipients, msg); sendErr != nil {
			log.Printf("ERROR: Unable to send contact request email: %v", sendErr)
			return errUnableToSendEmail
		}
	}

	return nil
}

func (s *Service) AfterInsert(_ context.Context, items []*resource.Item, err *error) {
	if err != nil && *err != nil {
		log.Println("ERROR: Not sending contact request email because there was an error saving the contact request")
		return
	}

	for _, item := range items {
		if s.cache != nil {
			id := fmt.Sprint(item.ID)
			s.cache.SetDefault(id, item.ID)
		}
	}
}

func buildMessage(recipients []string, item *resource.Item) ([]byte, error) {
	message, ok := item.Payload["message"].(string)
	if !ok {
		return nil, errors.New("message is missing")
	}
	replyTo, ok := item.Payload["contact_email"].(string)
	if !ok {
		return nil, errors.New("contact_email is missing")
	}

	var msgBytes bytes.Buffer
	if err := messageTemplate.Execute(&msgBytes, struct {
		Emails  string
		Message string
		ReplyTo string
	}{
		Emails:  strings.Join(recipients, ";"),
		Message: message,
		ReplyTo: replyTo,
	}); err != nil {
		return nil, err
	}

	return msgBytes.Bytes(), nil
}
