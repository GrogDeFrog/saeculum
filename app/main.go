package main

import (
	"net/http"
	"fmt"
)
func main() {
	fmt.Println("Starting web server...")
	mux := setupAPIRoutes()
	http.ListenAndServe(":23889", mux)
}
