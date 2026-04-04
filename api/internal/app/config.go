package app

import "os"

const defaultDataDir = "./db"
const defaultListenAddr = ":8080"
const defaultContactRequestsPerDay = 10

type Config struct {
	DataDir                  string
	ListenAddr               string
	Username                 string
	Password                 string
	SupportEmail             string
	StatsdAddress            string
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
		StatsdAddress:            os.Getenv("AFN_STATSD_URI"),
		MaxContactRequestsPerDay: defaultContactRequestsPerDay,
	}
}
