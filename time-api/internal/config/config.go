package config

import (
    "log"
    "os"
)

type Config struct {
    GoogleClientID     string
    GoogleClientSecret string
    OauthRedirectURL   string
    SessionKey         []byte
    ListenAddr         string
}

func Load() Config {
    c := Config{
        GoogleClientID:     mustEnv("GOOGLE_CLIENT_ID"),
        GoogleClientSecret: mustEnv("GOOGLE_CLIENT_SECRET"),
        OauthRedirectURL:   mustEnv("OAUTH_REDIRECT_URL"),
        SessionKey:         []byte(mustEnv("SESSION_KEY")),
        ListenAddr:         env("LISTEN_ADDR", ":23889"),
    }
    return c
}

func mustEnv(k string) string {
    v := os.Getenv(k)
    if v == "" {
        log.Fatalf("missing required env var %s", k)
    }
    return v
}

func env(k, def string) string {
    v := os.Getenv(k)
    if v == "" {
        return def
    }
    return v
}
