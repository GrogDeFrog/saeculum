package main

import (
    "log"
    "net/http"
    "time"
    "time-api/internal/config"
    "time-api/internal/handlers"
    "time-api/internal/middleware"
    "time-api/internal/session"

    "github.com/go-chi/chi/v5"
    chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
    cfg := config.Load()

    r := chi.NewRouter()
    r.Use(chimw.RequestID)
    r.Use(chimw.RealIP)
    r.Use(chimw.Logger)
    r.Use(chimw.Recoverer)
    r.Use(chimw.Timeout(30 * time.Second))

    // Auth routes (public)
    r.Mount("/auth", handlers.AuthRoutes(cfg))

    // Protected API
    r.Group(func(api chi.Router) {
        api.Use(middleware.SessionAuth(session.Store()))
        api.Mount("/entries", handlers.EntryRoutes())
    })

    log.Printf("LISTEN on %s", cfg.ListenAddr)
    log.Fatal(http.ListenAndServe(cfg.ListenAddr, r))
}
