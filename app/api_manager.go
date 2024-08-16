//api_manager.go
package main

import (
        "github.com/gorilla/sessions"
        "net/url"
        "net/http"
        "encoding/json"
        "path/filepath"
        "io"
        "fmt"
        //"time"
)

var store = sessions.NewCookieStore([]byte("your-secret-key"))

func init() {
        // Initialize session store configuration if needed
}

func storeGoogleUserInfo(content User, w http.ResponseWriter, r *http.Request){
        session, _ := store.Get(r, "session-name")
        session.Values["userID"] = content.ID
        session.Save(r, w)
     //   fmt.Fprintf(w, "ID: %s", content.ID)
}

func isAuthenticated(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                session, _ := store.Get(r, "session-name")
                userID, ok := session.Values["userID"].(string)
                if !ok || userID == "" {
                        http.Error(w, "Unauthorized", http.StatusUnauthorized)
                        return
                }
                // Continue to the protected route
                next.ServeHTTP(w, r)
        })
}


func startEntry(w http.ResponseWriter, r *http.Request) {
        // Implement the logic for starting a task
        // Parse the request JSON
        var entry TimeEntry
        if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
        }

        // get the user ID from the session
        session, _ := store.Get(r, "session-name")
        userID, ok := session.Values["userID"].(string)
        fmt.Printf("User with ID %s started task %s\n", userID, entry)
        if !ok || userID == "" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
        }

        startEntry, err := startEntryForUser(entry, userID)
        if err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
        }

        // Return the created entry
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(startEntry)
}

func endEntry(w http.ResponseWriter, r *http.Request) {
        // Implement the logic for ending a task
        // Parse the request JSON
        var entry TimeEntry
        if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
        }

        // get the user ID from the session
        session, _ := store.Get(r, "session-name")
        userID, ok := session.Values["userID"].(string)
        if !ok || userID == "" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
        }

        endEntry, err := endEntryForUser(entry, userID)
        if err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
        }

        // Return the created entry
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(endEntry)
}

func getEntries(w http.ResponseWriter, r *http.Request) {
        // parse the request JSON
        // get the user ID from the session
        // print out the entries for the user

        session, _ := store.Get(r, "session-name")
        userID, ok := session.Values["userID"].(string)
        if !ok || userID == "" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
        }

        entries, err := getEntriesForUser(userID)
        if err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
        }

        // Return the created entrys as JSON
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(entries)
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
        session, _ := store.Get(r, "session-name")
        session.Values["userID"] = ""
        session.Save(r, w)
        // Redirect to the login page or any other desired location
}

func handleApp(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/" {
                http.NotFound(w, r)
                return
        }
        fp := filepath.Join("app", "index.html")
        http.ServeFile(w, r, fp)
}

func handleTurtle(w http.ResponseWriter, r *http.Request) {
	// Set the target URL
	targetURL := "http://localhost:1927"

	// Parse the target URL
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		http.Error(w, "Error parsing target URL: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Clone the request and update the URL
	outReq := r.Clone(r.Context())
	outReq.URL = parsedURL
	outReq.URL.Scheme = parsedURL.Scheme
	outReq.URL.Host = parsedURL.Host
	outReq.URL.Path = r.URL.Path
	outReq.URL.RawQuery = r.URL.RawQuery
	outReq.RequestURI = "" // RequestURI must be empty for client requests

	// Forward the request to the target URL
	resp, err := http.DefaultClient.Do(outReq)
	if err != nil {
		http.Error(w, "Proxy error: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// Copy the headers and body from the target response to the response writer
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func setupAPIRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/login", handleGoogleLogin)
	mux.HandleFunc("/callback", handleGoogleCallback)
	mux.HandleFunc("/logout", logoutHandler)
	mux.HandleFunc("/signin", handleGoogleLogin)

	// Protected routes
	protectedMux := http.NewServeMux()
	protectedMux.Handle("/start", isAuthenticated(http.HandlerFunc(startEntry)))
	protectedMux.Handle("/end", isAuthenticated(http.HandlerFunc(endEntry)))
	protectedMux.Handle("/entries", isAuthenticated(http.HandlerFunc(getEntries)))

	// Combine public and protected routes
	mux.Handle("/api/", http.StripPrefix("/api", protectedMux))

	return mux
}
