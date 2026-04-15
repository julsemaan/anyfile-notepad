package app

import (
	"crypto/tls"
	"net"
	"net/smtp"
	"os"
	"strconv"
	"strings"

	"github.com/julsemaan/anyfile-notepad/api/internal/logging"
)

var smtpSendMail = smtp.SendMail
var smtpSendMailWithTLSConfig = sendMailWithTLSConfig

func sendEmailWithOptionalTLS(to []string, msg []byte) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	from := os.Getenv("SMTP_FROM")
	user := os.Getenv("SMTP_USER")
	password := os.Getenv("SMTP_PASSWORD")
	addr := net.JoinHostPort(host, port)

	var auth smtp.Auth
	if user != "" || password != "" {
		auth = smtp.PlainAuth("", user, password, host)
	}

	rawSkipTLSVerify := strings.TrimSpace(os.Getenv("SMTP_SKIP_TLS_VERIFY"))
	rawSkipTLSVerify = strings.Trim(rawSkipTLSVerify, "\"'")
	skipTLSVerify, _ := strconv.ParseBool(rawSkipTLSVerify)

	err := error(nil)
	if skipTLSVerify {
		err = smtpSendMailWithTLSConfig(addr, host, from, to, msg, auth, true)
	} else {
		err = smtpSendMail(addr, auth, from, to, msg)
	}
	if err != nil {
		logging.Error("Unable to send email:", err)
		return err
	}

	return nil
}

func sendMailWithTLSConfig(addr string, host string, from string, to []string, msg []byte, auth smtp.Auth, skipTLSVerify bool) error {
	client, err := smtp.Dial(addr)
	if err != nil {
		return err
	}
	defer client.Close()

	tlsConfig := &tls.Config{ServerName: host, InsecureSkipVerify: skipTLSVerify}
	if err := client.StartTLS(tlsConfig); err != nil {
		return err
	}

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(from); err != nil {
		return err
	}

	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}

	if _, err := writer.Write(msg); err != nil {
		return err
	}

	if err := writer.Close(); err != nil {
		return err
	}

	return client.Quit()
}
