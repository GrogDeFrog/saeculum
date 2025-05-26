package models

import (
    "time"

    "gorm.io/gorm"
)

type TimeEntry struct {
    gorm.Model
    Description string
    StartTime   time.Time
    EndTime     time.Time
    Duration    time.Duration
    ProjectID   *uint
    CategoryID  *uint
    UserID      uint
}

type LastEntry struct {
    gorm.Model
    UserID      uint `gorm:"uniqueIndex"`
    TimeEntryID uint
}
