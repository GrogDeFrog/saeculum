package main

import (
    "fmt"
    "time"
    "errors"
)

func startEntryForUser(entry TimeEntry, userID string) (TimeEntry, error) {
        // Set the start time for the entry
        entry.StartTime = time.Now()
        // set the end time to zero time
        entry.EndTime = time.Time{} // zero time
        entry.ID = fmt.Sprintf("%d", time.Now().UnixNano())
        entry.UserID = userID
        fmt.Println("Starting task with id ", entry.ID)

        // Create the new time entry in the database
        db := initDB()
        // Find the user in the LastEntry table
        var lastEntry LastEntry
        lastEntry.UserID = userID
        // change result to first or create. if not first then create with last entry ID being 0
        result := db.Where("user_id = ?", userID).FirstOrCreate(&lastEntry)
        if result.Error != nil {
                return entry, result.Error
        }
        // If the user has a last entry, set the end time for the entry
        if lastEntry.TimeEntryID != "0" {
                var lastTimeEntry TimeEntry
                result3 := db.Where("id = ?", lastEntry.TimeEntryID).First(&lastTimeEntry)
                if result3.Error != nil {
                        return entry, result3.Error
                }
                lastTimeEntry.EndTime = time.Now()
                lastTimeEntry.Duration = lastTimeEntry.EndTime.Sub(lastTimeEntry.StartTime)
                // update the the database 
                // change result to save
                result2 := db.Save(&lastTimeEntry)
                if result2.Error != nil { return entry, result2.Error }
        }

        result_create := db.Create(&entry)

        if result_create.Error != nil {
                return entry, result_create.Error
        }


        lastEntry.TimeEntryID = entry.ID
        lastEntry.UserID = userID
        result = db.Save(&lastEntry)
        if result.Error != nil {
                return entry, result.Error
        }

        // Return the created entry
        return entry, nil
}

func endEntryForUser (entry TimeEntry, userID string) (TimeEntry, error) {
        // find the entry in the database
        db := initDB()
        var timeEntry TimeEntry
        result := db.Where("id = ?", entry.ID).First(&timeEntry)
        if result.Error != nil {
                return entry, result.Error
        }

        // check if the entry is already ended
        if !timeEntry.EndTime.IsZero() {
                return entry, fmt.Errorf("the entry has already ended")
        }

        // Set the end time for the entry
        timeEntry.EndTime = time.Now()
        timeEntry.Duration = timeEntry.EndTime.Sub(timeEntry.StartTime)

        result = db.Save(&timeEntry)
        if result.Error != nil {
                return entry, result.Error
        }
        // Return the created entry
        return timeEntry, nil
}

func deleteEntryForUser(entryID string, userID string) error {
        if entryID == "0" {
            return errors.New("invalid entry ID: cannot be 0")
        }
        db := initDB()

        // Find the time entry by ID and user ID
        result := db.Where("id = ? AND user_id = ?", entryID, userID).Delete(&TimeEntry{})
        if result.Error != nil {
                return result.Error
        }

        return nil
}

func getEntriesForUser(userID string) ([]TimeEntry, error) {
        // get the entries for the user
        db := initDB()
        var entries []TimeEntry
        result := db.Where("user_id = ?", userID).Order("start_time desc").Find(&entries)
        if result.Error != nil {
                return entries, result.Error
        }
        // Return the created entry
        return entries, nil
}

func deleteAllZeroIDEntriesForUser(userID string) error {
    db := initDB()
    result := db.Where("id = ? AND user_id = ?", 0, userID).Delete(&TimeEntry{})
    return result.Error
}
