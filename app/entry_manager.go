package main

import (
    "fmt"
    "time"
)

func startEntryForUser(entry TimeEntry, userID string) (TimeEntry, error) {
        // Set the start time for the entry
        entry.StartTime = time.Now()
        // set the end time to zero time
        entry.EndTime = time.Time{} // zero time
        entry.ID = uint(time.Now().UnixNano())
        entry.UserID = userID

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
        if lastEntry.TimeEntryID != 0 {
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

func deleteEntryForUser (entry TimeEntry, userID string) (error) {
        // find the entry in the database
        db := initDB()

        var timeEntry TimeEntry
        timeEntry.ID = entry.ID
        //timeEntry.UserID = userID
        //result := db.Where("id = ? AND user_id = ?", entry.ID, userID).First(&timeEntry)
        fmt.Println("id: ", entry.ID);
        result := db.Where("id = ?", entry.ID).First(&timeEntry)
        fmt.Println("id: ", entry.ID);

        if result.Error != nil {
                fmt.Println("Error in location!");
                return result.Error
        }
        
        result = db.Delete(&timeEntry)
        if result.Error != nil {
            fmt.Println("Error in deletion!");
            return result.Error
        }
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
