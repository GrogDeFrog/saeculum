package config

import (
	"log"
	"os"
	"sync"
)

type Config struct {
	GoogleClientID     string
	GoogleClientSecret string
	SessionKey         []byte
	GoogleRedirectURL  string
}

var (
	once sync.Once
	cfg  Config
)

func Load() Config {
	once.Do(func() {
		cfg = Config{
			GoogleClientID:     mustEnv("GOOGLE_CLIENT_ID"),
			GoogleClientSecret: mustEnv("GOOGLE_CLIENT_SECRET"),
			SessionKey:         []byte(mustEnv("SESSION_KEY")),
			GoogleRedirectURL:  mustEnv("GOOGLE_REDIRECT_URL"),
		}
	})
	return cfg
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("missing required env var %s", k)
	}
	return v
}
