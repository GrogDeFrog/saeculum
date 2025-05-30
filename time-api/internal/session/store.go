package session

import (
	"net/http"
	"sync"

	"time-api/internal/config"

	"github.com/gorilla/sessions"
)

var (
	store sessions.Store
	once  sync.Once
)

func Store() sessions.Store {
	once.Do(func() {
		cfg := config.Load()
		cs := sessions.NewCookieStore(cfg.SessionKey)

		cs.Options = &sessions.Options{
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   0,
		}
		store = cs
	})
	return store
}
