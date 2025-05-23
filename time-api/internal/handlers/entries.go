package handlers

import (
    "encoding/json"
    "net/http"
    "time"
    "time-api/internal/database"
    "time-api/internal/middleware"
    "time-api/internal/models"

    "github.com/go-chi/chi/v5"
)

func EntryRoutes() http.Handler {
    r := chi.NewRouter()

    r.Post("/start", createStart)
    r.Post("/end", createEnd)
    r.Post("/delete", deleteEntry)
    r.Get("/", listEntries)

    return r
}

type entryReq struct {
    Description string `json:"description,omitempty"`
    ID          uint   `json:"id,omitempty"`
}

func createStart(w http.ResponseWriter, r *http.Request) {
    var req entryReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    db := database.DB()
    entry := models.TimeEntry{
        Description: req.Description,
        StartTime:   time.Now(),
        UserID:      middleware.UID(r),
    }
    if err := db.Create(&entry).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    writeJSON(w, entry)
}

func createEnd(w http.ResponseWriter, r *http.Request) {
    var req entryReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    db := database.DB()
    var entry models.TimeEntry
    if err := db.Where("id = ? AND user_id = ?", req.ID, middleware.UID(r)).First(&entry).Error; err != nil {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    if !entry.EndTime.IsZero() {
        http.Error(w, "already ended", http.StatusBadRequest)
        return
    }
    entry.EndTime = time.Now()
    entry.Duration = entry.EndTime.Sub(entry.StartTime)
    db.Save(&entry)
    writeJSON(w, entry)
}

func deleteEntry(w http.ResponseWriter, r *http.Request) {
    var req entryReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    db := database.DB()
    if err := db.Where("id = ? AND user_id = ?", req.ID, middleware.UID(r)).Delete(&models.TimeEntry{}).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

func listEntries(w http.ResponseWriter, r *http.Request) {
    db := database.DB()
    var entries []models.TimeEntry
    if err := db.Where("user_id = ?", middleware.UID(r)).Order("start_time desc").Find(&entries).Error; err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    writeJSON(w, entries)
}

func writeJSON(w http.ResponseWriter, v any) {
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(v)
}
