package com.example.ExamPilot.controller;

import com.example.ExamPilot.model.ExamFolder;
// import com.examscheduler.model.Timetable;
import com.example.ExamPilot.model.Timetable;
import com.example.ExamPilot.service.ExamFolderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exam-folders")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ExamFolderController {

    @Autowired
    private ExamFolderService examFolderService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ExamFolder>> getExamFoldersByUser(@PathVariable String userId) {
        List<ExamFolder> folders = examFolderService.getExamFoldersByUserId(userId);
        return ResponseEntity.ok(folders);
    }

    @PostMapping
    public ResponseEntity<ExamFolder> createExamFolder(@RequestBody ExamFolder examFolder) {
        ExamFolder savedFolder = examFolderService.createExamFolder(examFolder);
        return ResponseEntity.ok(savedFolder);
    }

    @PutMapping("/{folderId}")
    public ResponseEntity<ExamFolder> updateExamFolder(
            @PathVariable String folderId, 
            @RequestBody ExamFolder examFolder) {
        ExamFolder updatedFolder = examFolderService.updateExamFolder(folderId, examFolder);
        if (updatedFolder != null) {
            return ResponseEntity.ok(updatedFolder);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<?> deleteExamFolder(@PathVariable String folderId) {
        boolean deleted = examFolderService.deleteExamFolder(folderId);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Exam folder deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{folderId}/timetables")
    public ResponseEntity<ExamFolder> addTimetableToFolder(
            @PathVariable String folderId, 
            @RequestBody Timetable timetable) {
        ExamFolder updatedFolder = examFolderService.addTimetableToFolder(folderId, timetable);
        if (updatedFolder != null) {
            return ResponseEntity.ok(updatedFolder);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{folderId}/timetables/{timetableId}")
    public ResponseEntity<ExamFolder> updateTimetableInFolder(
            @PathVariable String folderId,
            @PathVariable String timetableId,
            @RequestBody Timetable timetable) {
        ExamFolder updatedFolder = examFolderService.updateTimetableInFolder(folderId, timetableId, timetable);
        if (updatedFolder != null) {
            return ResponseEntity.ok(updatedFolder);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{folderId}/timetables/{timetableId}")
    public ResponseEntity<ExamFolder> deleteTimetableFromFolder(
            @PathVariable String folderId,
            @PathVariable String timetableId) {
        ExamFolder updatedFolder = examFolderService.deleteTimetableFromFolder(folderId, timetableId);
        if (updatedFolder != null) {
            return ResponseEntity.ok(updatedFolder);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/create-with-timetable")
    public ResponseEntity<ExamFolder> createFolderWithTimetable(
            @RequestParam String userId,
            @RequestBody Timetable timetable) {
        ExamFolder newFolder = examFolderService.createFolderForTimetable(userId, timetable);
        if (newFolder != null) {
            return ResponseEntity.ok(newFolder);
        } else {
            return ResponseEntity.badRequest().build();
        }
    }
}
