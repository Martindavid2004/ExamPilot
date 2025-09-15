package com.example.ExamPilot.service;

import com.example.ExamPilot.model.ExamFolder;
import com.example.ExamPilot.model.Timetable;
import com.example.ExamPilot.repository.ExamFolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ExamFolderService {

    @Autowired
    private ExamFolderRepository examFolderRepository;

    public List<ExamFolder> getExamFoldersByUserId(String userId) {
        return examFolderRepository.findByUserId(userId);
    }

    public ExamFolder createExamFolder(ExamFolder examFolder) {
        examFolder.setCreatedAt(LocalDateTime.now());
        examFolder.setUpdatedAt(LocalDateTime.now());
        if (examFolder.getTimetables() == null) {
            examFolder.setTimetables(new ArrayList<>());
        }
        return examFolderRepository.save(examFolder);
    }

    public ExamFolder updateExamFolder(String folderId, ExamFolder examFolder) {
        Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
        if (existingFolder.isPresent()) {
            ExamFolder folder = existingFolder.get();
            folder.setFolderName(examFolder.getFolderName());
            folder.setDescription(examFolder.getDescription());
            folder.setTimetables(examFolder.getTimetables());
            folder.setUpdatedAt(LocalDateTime.now());
            return examFolderRepository.save(folder);
        }
        return null;
    }

    public boolean deleteExamFolder(String folderId) {
        if (examFolderRepository.existsById(folderId)) {
            examFolderRepository.deleteById(folderId);
            return true;
        }
        return false;
    }

    public ExamFolder addTimetableToFolder(String folderId, Timetable timetable) {
        Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
        if (existingFolder.isPresent()) {
            ExamFolder folder = existingFolder.get();
            
            // Generate unique ID for timetable if not present
            if (timetable.getId() == null || timetable.getId().isEmpty()) {
                timetable.setId(String.valueOf(System.currentTimeMillis()));
            }
            
            timetable.setCreatedAt(LocalDateTime.now());
            timetable.setUpdatedAt(LocalDateTime.now());
            
            if (folder.getTimetables() == null) {
                folder.setTimetables(new ArrayList<>());
            }
            
            folder.getTimetables().add(timetable);
            folder.setUpdatedAt(LocalDateTime.now());
            
            return examFolderRepository.save(folder);
        }
        return null;
    }

    public ExamFolder updateTimetableInFolder(String folderId, String timetableId, Timetable updatedTimetable) {
        Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
        if (existingFolder.isPresent()) {
            ExamFolder folder = existingFolder.get();
            
            if (folder.getTimetables() != null) {
                for (int i = 0; i < folder.getTimetables().size(); i++) {
                    if (folder.getTimetables().get(i).getId().equals(timetableId)) {
                        updatedTimetable.setId(timetableId);
                        updatedTimetable.setUpdatedAt(LocalDateTime.now());
                        // Preserve created date
                        if (updatedTimetable.getCreatedAt() == null) {
                            updatedTimetable.setCreatedAt(folder.getTimetables().get(i).getCreatedAt());
                        }
                        folder.getTimetables().set(i, updatedTimetable);
                        folder.setUpdatedAt(LocalDateTime.now());
                        return examFolderRepository.save(folder);
                    }
                }
            }
        }
        return null;
    }

    public ExamFolder deleteTimetableFromFolder(String folderId, String timetableId) {
        Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
        if (existingFolder.isPresent()) {
            ExamFolder folder = existingFolder.get();
            
            if (folder.getTimetables() != null) {
                folder.getTimetables().removeIf(timetable -> timetable.getId().equals(timetableId));
                folder.setUpdatedAt(LocalDateTime.now());
                return examFolderRepository.save(folder);
            }
        }
        return null;
    }

    public ExamFolder getExamFolderByUserAndName(String userId, String folderName) {
        Optional<ExamFolder> folder = examFolderRepository.findByUserIdAndFolderName(userId, folderName);
        return folder.orElse(null);
    }
}
