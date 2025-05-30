package main

import (
	"log"
	"net/http"
	"time"

	"time-api/internal/config"
	"time-api/internal/handlers"
	"time-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Make sure config correctly set
	config.Load()

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(30 * time.Second))

	r.Mount("/auth", handlers.AuthRoutes())

	r.Group(func(api chi.Router) {
		api.Use(middleware.SessionAuth)
		api.Mount("/entries", handlers.EntryRoutes())
		api.Mount("/user", handlers.UserRoutes())
	})

	port := ":23889"
	log.Printf("LISTEN on %s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
