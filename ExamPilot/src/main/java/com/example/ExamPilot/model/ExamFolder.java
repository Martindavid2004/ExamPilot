package com.example.ExamPilot.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "exam_folders")
public class ExamFolder {
    @Id
    private String id;
    private String userId;
    private String folderName;
    private String description;
    private List<Timetable> timetables = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public ExamFolder() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public ExamFolder(String userId, String folderName, String description) {
        this();
        this.userId = userId;
        this.folderName = folderName;
        this.description = description;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getFolderName() { return folderName; }
    public void setFolderName(String folderName) { this.folderName = folderName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Timetable> getTimetables() { return timetables; }
    public void setTimetables(List<Timetable> timetables) { this.timetables = timetables; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public void addTimetable(Timetable timetable) {
        this.timetables.add(timetable);
        this.updatedAt = LocalDateTime.now();
    }

    public boolean removeTimetable(String timetableId) {
        boolean removed = this.timetables.removeIf(t -> t.getId().equals(timetableId));
        if (removed) {
            this.updatedAt = LocalDateTime.now();
        }
        return removed;
    }
}

