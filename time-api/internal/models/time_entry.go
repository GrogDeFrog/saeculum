package models

import (
    "time"

    "gorm.io/gorm"
)

type TimeEntry struct {
    gorm.Model

    UserID      uint      `gorm:"not null;index"`

    Description string    `gorm:"not null"`
    StartTime   time.Time `gorm:"not null"`
    EndTime     time.Time `gorm:"not null"`
}
