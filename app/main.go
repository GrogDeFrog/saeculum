package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Starting web server...")
	mux := setupAPIRoutes()
	http.ListenAndServe(":23889", mux)
}
