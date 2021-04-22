package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
)

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

func EnvOrDefault(varName, defaultVal string) string {
	if val := os.Getenv(varName); val != "" {
		return val
	} else {
		return defaultVal
	}
}
