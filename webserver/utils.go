package main

import (
	"fmt"
	"net/smtp"
	"os"
)

func sendEmail(to []string, msg []byte) error {
	// Choose auth method and set it up
	auth := smtp.PlainAuth("", os.Getenv("SMTP_USER"), os.Getenv("SMTP_PASSWORD"), os.Getenv("SMTP_HOST"))

	// Here we do it all: connect to our server, set up a message and send it
	err := smtp.SendMail(os.Getenv("SMTP_HOST")+":"+os.Getenv("SMTP_PORT"), auth, os.Getenv("SMTP_FROM"), to, msg)
	if err != nil {
		fmt.Println("ERROR: Unable to send email:", err)
		return err
	}

	return nil
}
