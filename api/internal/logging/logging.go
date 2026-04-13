package logging

import "log"

func Error(args ...interface{}) {
	args = append([]interface{}{"ERROR:"}, args...)
	log.Println(args...)
}

func Errorf(format string, args ...interface{}) {
	log.Printf("ERROR: "+format, args...)
}

func Fatalf(format string, args ...interface{}) {
	log.Fatalf("ERROR: "+format, args...)
}
