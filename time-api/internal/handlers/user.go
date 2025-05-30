package handlers

import (
	"encoding/json"
	"net/http"

	"time-api/internal/database"
	"time-api/internal/middleware"
	"time-api/internal/models"

	"github.com/go-chi/chi/v5"
)

// UserRoutes exposes user-profile endpoints (all session-protected).
func UserRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", currentUser)
	return r
}

type currentTask struct {
	Description string `json:"description"`
	StartMS     int64  `json:"start_time"` // Unix ms
}

type userResp struct {
	ID          uint         `json:"id"`
	Email       string       `json:"email"`
	CurrentTask *currentTask `json:"current_task,omitempty"`
}

// currentUser returns the authenticated user’s profile and—in-flight task (if any).
func currentUser(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	db := database.DB()
	var user models.User
	if err := db.First(&user, uid).Error; err != nil {
		http.Error(w, "user not found", http.StatusInternalServerError)
		return
	}

	resp := userResp{
		ID:    user.ID,
		Email: user.Email,
	}

	if user.CurrentTaskStartTime != 0 {
		resp.CurrentTask = &currentTask{
			Description: user.CurrentTaskDescription,
			StartMS:     int64(user.CurrentTaskStartTime),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
