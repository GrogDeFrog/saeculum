// models.go 
package main

import (
        "gorm.io/driver/sqlite"
        "gorm.io/gorm"
        "time"
//        "fmt"
)
type User struct {
        gorm.Model
        ID             string `json:"id"`
        Email          string `json:"email"`
        VerifiedEmail  bool   `json:"verified_email"`
        Picture        string `json:"picture"`
}

type LastEntry struct {
        gorm.Model
        UserID      string
        TimeEntryID string
}

type TimeEntry struct {
        gorm.Model
        ID          string
        Description string
        StartTime   time.Time
        EndTime     time.Time
        Duration    time.Duration
        ProjectID   *uint
        CategoryID  *uint
        UserID      string
}

type Project struct {
        gorm.Model
        ProjectName       string
        AdditionalDetails string
}

type Category struct {
        gorm.Model
        CategoryName string
}
func initDB() *gorm.DB {
//	fmt.Println("initDB() called")
	// SQLite database connection
	db, err := gorm.Open(sqlite.Open("timetracker.db"), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to the database")
	}

	// Auto-migrate the database schema including the User model
	if err := db.AutoMigrate(&User{}, &LastEntry{}, &TimeEntry{}, &Project{}, &Category{}); err != nil {
		panic("Failed to auto-migrate the database schema")
	}

	return db
}


