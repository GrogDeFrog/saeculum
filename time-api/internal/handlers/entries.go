package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"time-api/internal/database"
	"time-api/internal/middleware"
	"time-api/internal/models"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func EntryRoutes() http.Handler {
	r := chi.NewRouter()

	r.Post("/start", startTask)
	r.Post("/end", endTask)
	r.Post("/delete", deleteEntry)
	r.Post("/edit", editEntry)
	r.Get("/", getEntries)

	return r
}

// closeRunningTask flushes the in-progress task (if any) to the DB
// and clears the marker fields on the User record.
func closeRunningTask(db *gorm.DB, user *models.User) error {
	if user.CurrentTaskStartTime == 0 {
		return nil // nothing to close
	}

	entry := models.TimeEntry{
		UserID:      user.ID,
		Description: user.CurrentTaskDescription,
		StartTime:   time.UnixMilli(int64(user.CurrentTaskStartTime)),
		EndTime:     time.Now(),
	}
	if err := db.Create(&entry).Error; err != nil {
		return err
	}

	user.CurrentTaskDescription = ""
	user.CurrentTaskStartTime = 0
	return db.Save(user).Error
}

type startReq struct {
	Description string `json:"description"`
}

func startTask(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req startReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Description == "" {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	db := database.DB()
	var user models.User
	if err := db.First(&user, uid).Error; err != nil {
		http.Error(w, "user not found", http.StatusInternalServerError)
		return
	}

	if err := closeRunningTask(db, &user); err != nil {
		http.Error(w, "cannot end previous task", http.StatusInternalServerError)
		return
	}

	user.CurrentTaskDescription = req.Description
	user.CurrentTaskStartTime = uint(time.Now().UnixMilli())
	if err := db.Save(&user).Error; err != nil {
		http.Error(w, "cannot save task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func endTask(w http.ResponseWriter, r *http.Request) {
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

	if user.CurrentTaskStartTime == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if err := closeRunningTask(db, &user); err != nil {
		http.Error(w, "cannot end task", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

type deleteReq struct {
	EntryID uint `json:"entry_id"`
}

func deleteEntry(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req deleteReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.EntryID == 0 {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	db := database.DB()
	if err := db.Where("id = ? AND user_id = ?", req.EntryID, uid).
		Delete(&models.TimeEntry{}).Error; err != nil {
		http.Error(w, "delete failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type editReq struct {
	EntryID     uint   `json:"entry_id"`
	Description string `json:"description,omitempty"`
	StartMS     *int64 `json:"start_time,omitempty"` // Unix ms
	EndMS       *int64 `json:"end_time,omitempty"`   // Unix ms
}

func editEntry(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req editReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.EntryID == 0 {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	db := database.DB()
	var entry models.TimeEntry
	if err := db.Where("id = ? AND user_id = ?", req.EntryID, uid).
		First(&entry).Error; err != nil {
		http.Error(w, "entry not found", http.StatusNotFound)
		return
	}

	updates := map[string]interface{}{}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.StartMS != nil {
		updates["start_time"] = time.UnixMilli(*req.StartMS)
	}
	if req.EndMS != nil {
		updates["end_time"] = time.UnixMilli(*req.EndMS)
	}
	if len(updates) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if err := db.Model(&entry).Updates(updates).Error; err != nil {
		http.Error(w, "update failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func getEntries(w http.ResponseWriter, r *http.Request) {
	uid, ok := middleware.UserID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	db := database.DB()
	var entries []models.TimeEntry
	if err := db.Where("user_id = ?", uid).
		Order("start_time DESC").
		Find(&entries).Error; err != nil {
		http.Error(w, "fetch failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(entries)
}
