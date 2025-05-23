package middleware

import (
    "context"
    "net/http"

    "github.com/gorilla/sessions"
)

type contextKey string

const userIDKey contextKey = "uid"

func SessionAuth(store *sessions.CookieStore) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            sess, _ := store.Get(r, "sess")
            id, _ := sess.Values["uid"].(uint)
            if id == 0 {
                http.Error(w, "unauthorized", http.StatusUnauthorized)
                return
            }
            ctx := context.WithValue(r.Context(), userIDKey, id)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func UID(r *http.Request) uint {
    return r.Context().Value(userIDKey).(uint)
}
