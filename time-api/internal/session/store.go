package session

import (
    "time-api/internal/config"

    "github.com/gorilla/sessions"
)

var store *sessions.CookieStore

func Store() *sessions.CookieStore {
    if store == nil {
        cfg := config.Load()
        store = sessions.NewCookieStore(cfg.SessionKey)
        store.Options.HttpOnly = true
        store.Options.SameSite = 3 // SameSite=Lax
        store.Options.Path = "/"
        store.Options.MaxAge = 60 * 60 * 24 * 30 // 30 days
    }
    return store
}
