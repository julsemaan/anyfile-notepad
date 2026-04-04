package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
)

func secureRandomString(c int) string {
	b := make([]byte, c)
	if _, err := rand.Read(b); err != nil {
		log.Printf("ERROR: unable to generate a secure random string: %v", err)
		return ""
	}
	return hex.EncodeToString(b)
}

func InfoPrint(a ...interface{}) {
	a = append([]interface{}{"INFO:"}, a...)
	log.Println(a...)
}

func ErrPrint(a ...interface{}) {
	a = append([]interface{}{"ERROR:"}, a...)
	log.Println(a...)
}

func EnvOrDefault(varName, defaultVal string) string {
	if val := os.Getenv(varName); val != "" {
		return val
	}
	return defaultVal
}
