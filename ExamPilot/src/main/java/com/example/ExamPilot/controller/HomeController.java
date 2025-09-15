package com.example.ExamPilot.controller;

import com.example.ExamPilot.model.ExamFolder;
import com.example.ExamPilot.model.Timetable;
import com.example.ExamPilot.service.ExamFolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
public class HomeController {

    @Autowired
    private ExamFolderService examFolderService;

    @GetMapping("/")
    public String home() {
        return "ExamPilot Application is running successfully!";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/api/exam-folders/user/{username}")
    public ResponseEntity<List<ExamFolder>> getExamFolders(@PathVariable String username) {
        try {
            List<ExamFolder> examFolders = examFolderService.getExamFoldersByUserId(username);
            return ResponseEntity.ok(examFolders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/exam-folders")
    public ResponseEntity<ExamFolder> createExamFolder(@RequestBody ExamFolder examFolderData) {
        try {
            ExamFolder savedFolder = examFolderService.createExamFolder(examFolderData);
            return ResponseEntity.ok(savedFolder);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/api/exam-folders/{folderId}/timetables")
    public ResponseEntity<ExamFolder> addTimetableToFolder(
            @PathVariable String folderId, 
            @RequestBody Timetable timetableData) {
        try {
            ExamFolder updatedFolder = examFolderService.addTimetableToFolder(folderId, timetableData);
            if (updatedFolder != null) {
                return ResponseEntity.ok(updatedFolder);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/api/exam-folders/{folderId}/timetables/{timetableId}")
    public ResponseEntity<ExamFolder> updateTimetable(
            @PathVariable String folderId,
            @PathVariable String timetableId,
            @RequestBody Timetable updatedTimetable) {
        try {
            ExamFolder updatedFolder = examFolderService.updateTimetableInFolder(folderId, timetableId, updatedTimetable);
            if (updatedFolder != null) {
                return ResponseEntity.ok(updatedFolder);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/api/exam-folders/{folderId}/timetables/{timetableId}")
    public ResponseEntity<ExamFolder> deleteTimetable(
            @PathVariable String folderId,
            @PathVariable String timetableId) {
        try {
            ExamFolder updatedFolder = examFolderService.deleteTimetableFromFolder(folderId, timetableId);
            if (updatedFolder != null) {
                return ResponseEntity.ok(updatedFolder);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/api/exam-folders/{folderId}")
    public ResponseEntity<Void> deleteExamFolder(@PathVariable String folderId) {
        try {
            boolean deleted = examFolderService.deleteExamFolder(folderId);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
