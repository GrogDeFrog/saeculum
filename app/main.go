package main

import (
	"net/http"
	"fmt"
)
func main() {
	fmt.Println("Starting web server...")
	mux := setupAPIRoutes()
    err := deleteAllZeroIDEntriesForUser("108049832511743894824")
    if (err != nil) {
        fmt.Print(err);
    }
	http.ListenAndServe(":23889", mux)
}
