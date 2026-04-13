package main

import (
	"log"

	"github.com/julsemaan/anyfile-notepad/api/internal/app"
)

func main() {
	if err := app.Run(app.LoadConfigFromEnv()); err != nil {
		log.Fatalf("ERROR: %v", err)
	}
}
