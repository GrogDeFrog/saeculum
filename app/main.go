package main

import (
	"net/http"
	"fmt"
)
func main() {
	fmt.Println("Starting web server...")
	mux := setupAPIRoutes()
    err := relabelEntries()
    if (err != nil) {
        fmt.Println("Error: ", err)
    }
	http.ListenAndServe(":23889", mux)
}
