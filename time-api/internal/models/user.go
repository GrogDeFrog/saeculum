package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	GoogleID               string `gorm:"uniqueIndex"`
	Email                  string `gorm:"not null;uniqueIndex"`

	CurrentTaskDescription string
	CurrentTaskStartTime   uint
}
