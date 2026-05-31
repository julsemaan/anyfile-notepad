package main

import (
	"github.com/julsemaan/anyfile-notepad/api/internal/app"
	"github.com/julsemaan/anyfile-notepad/api/internal/logging"
)

func main() {
	if err := app.Run(app.LoadConfigFromEnv()); err != nil {
		logging.Fatalf("%v", err)
	}
}
