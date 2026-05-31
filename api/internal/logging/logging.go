package logging

import (
	"fmt"
	"log"
	"os"
	"strings"
)

const errorPrefix = "ERROR:"

func output(message string) {
	_ = log.Default().Output(3, message)
}

func Error(args ...interface{}) {
	msg := strings.TrimSuffix(fmt.Sprintln(args...), "\n")
	if msg == "" {
		output(errorPrefix)
		return
	}

	output(errorPrefix + " " + msg)
}

func Errorf(format string, args ...interface{}) {
	output(errorPrefix + " " + fmt.Sprintf(format, args...))
}

func Fatalf(format string, args ...interface{}) {
	output(errorPrefix + " " + fmt.Sprintf(format, args...))
	os.Exit(1)
}
