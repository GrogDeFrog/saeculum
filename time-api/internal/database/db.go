package database

import (
    "log"
    "sync"
    "time"

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
        db, err = gorm.Open(sqlite.Open("data.db"), &gorm.Config{
            Logger: logger.Default.LogMode(logger.Info),
        })
        if err != nil {
            log.Fatalf("cannot open DB: %v", err)
        }
        if err := db.AutoMigrate(
            &models.User{},
            &models.LastEntry{},
            &models.TimeEntry{},
            &models.Project{},
            &models.Category{},
        ); err != nil {
            log.Fatalf("auto-migrate failed: %v", err)
        }
        sqlDB, _ := db.DB()
        sqlDB.SetConnMaxLifetime(5 * time.Minute)
    })
    return db
}
