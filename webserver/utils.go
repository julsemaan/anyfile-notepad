package main

import (
	"crypto/rand"
	"encoding/hex"
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

func secureRandomString(c int) string {
	b := make([]byte, c)
	_, err := rand.Read(b)
	if err != nil {
		fmt.Println("ERROR: unable to generate a secure random string", err)
		return ""
	}
	return hex.EncodeToString(b)
}

func InfoPrint(a ...interface{}) {
	a = append([]interface{}{"INFO:"}, a...)
	fmt.Println(a...)
}

func ErrPrint(a ...interface{}) {
	a = append([]interface{}{"ERROR:"}, a...)
	fmt.Println(a...)
}
