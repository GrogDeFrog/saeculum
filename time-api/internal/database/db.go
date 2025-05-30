package database

import (
	"log"
	"sync"

	"time-api/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	once sync.Once
	db   *gorm.DB
)

func DB() *gorm.DB {
	once.Do(func() {
		var err error
		db, err = gorm.Open(sqlite.Open("database.db"), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("cannot open database: %v", err)
		}

		if err := db.AutoMigrate(
			&models.User{},
			&models.TimeEntry{},
		); err != nil {
			log.Fatalf("failed to migrate schema: %v", err)
		}
	})
	return db
}
