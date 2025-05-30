package middleware

import (
	"context"
	"net/http"

	"time-api/internal/session"
)

type ctxKey string

const userIDKey ctxKey = "user_id"

// Rejects requests without a valid logged-in session and injects the user-ID
// into request context.
func SessionAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess, _ := session.Store().Get(r, "session")
		rawID, ok := sess.Values["user_id"]
		uid, typeOK := rawID.(uint)
		if !ok || !typeOK || uid == 0 {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, uid)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserID extracts the authenticated user’s ID from context.
func UserID(r *http.Request) (uint, bool) {
	uid, ok := r.Context().Value(userIDKey).(uint)
	return uid, ok
}
