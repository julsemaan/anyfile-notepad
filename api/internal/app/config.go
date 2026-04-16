package app

import (
	"os"
	"strconv"
)

const defaultDataDir = "./db"
const defaultListenAddr = ":8080"
const defaultContactRequestsPerDay = 10
const envMaxContactRequestsPerDay = "AFN_MAX_CONTACT_REQUESTS_PER_DAY"

type Config struct {
	DataDir                  string
	ListenAddr               string
	Username                 string
	Password                 string
	SupportEmail             string
	MaxContactRequestsPerDay int
}

func LoadConfigFromEnv() Config {
	dataDir := os.Getenv("AFN_REST_DATA_DIR")
	if dataDir == "" {
		dataDir = defaultDataDir
	}

	listenAddr := os.Getenv("AFN_REST_LISTEN_ADDR")
	if listenAddr == "" {
		listenAddr = defaultListenAddr
	}

	return Config{
		DataDir:                  dataDir,
		ListenAddr:               listenAddr,
		Username:                 os.Getenv("AFN_REST_USERNAME"),
		Password:                 os.Getenv("AFN_REST_PASSWORD"),
		SupportEmail:             os.Getenv("AFN_SUPPORT_EMAIL"),
		MaxContactRequestsPerDay: loadMaxContactRequestsPerDay(),
	}
}

func loadMaxContactRequestsPerDay() int {
	maxPerDay, err := strconv.Atoi(os.Getenv(envMaxContactRequestsPerDay))
	if err != nil || maxPerDay <= 0 {
		return defaultContactRequestsPerDay
	}

	return maxPerDay
}
