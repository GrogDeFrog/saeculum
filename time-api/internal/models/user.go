package models

import "gorm.io/gorm"

type User struct {
    gorm.Model
    GoogleID      string `gorm:"uniqueIndex"`
    Email         string
    VerifiedEmail bool
    Picture       string
}
