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

    @Autowired(required = false)
    private ExamFolderRepository examFolderRepository;

    public List<ExamFolder> getExamFoldersByUserId(String userId) {
        if (examFolderRepository == null) {
            return new ArrayList<>();
        }
        try {
            return examFolderRepository.findByUserId(userId);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public ExamFolder createExamFolder(ExamFolder examFolder) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
            examFolder.setCreatedAt(LocalDateTime.now());
            examFolder.setUpdatedAt(LocalDateTime.now());
            if (examFolder.getTimetables() == null) {
                examFolder.setTimetables(new ArrayList<>());
            }
            return examFolderRepository.save(examFolder);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return null;
        }
    }

    public ExamFolder updateExamFolder(String folderId, ExamFolder examFolder) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
            Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
            if (existingFolder.isPresent()) {
                ExamFolder folder = existingFolder.get();
                folder.setFolderName(examFolder.getFolderName());
                folder.setDescription(examFolder.getDescription());
                folder.setTimetables(examFolder.getTimetables());
                folder.setUpdatedAt(LocalDateTime.now());
                return examFolderRepository.save(folder);
            }
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return null;
    }

    public boolean deleteExamFolder(String folderId) {
        if (examFolderRepository == null) {
            return false;
        }
        try {
            if (examFolderRepository.existsById(folderId)) {
                examFolderRepository.deleteById(folderId);
                return true;
            }
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return false;
    }

    public ExamFolder addTimetableToFolder(String folderId, Timetable timetable) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
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
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return null;
    }

    // New method to create a folder for each timetable based on the timetable name
    public ExamFolder createFolderForTimetable(String userId, Timetable timetable) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
            // Use the timetable name as the folder name
            String folderName = timetable.getTableName();
            
            // Check if a folder with this name already exists for this user
            ExamFolder existingFolder = getExamFolderByUserAndName(userId, folderName);
            
            if (existingFolder != null) {
                // If folder exists, create a new unique folder name
                folderName = generateUniqueFolderName(userId, folderName);
            }
            
            // Create new folder
            ExamFolder newFolder = new ExamFolder(userId, folderName, "Folder for " + timetable.getTableName());
            
            // Generate unique ID for timetable if not present
            if (timetable.getId() == null || timetable.getId().isEmpty()) {
                timetable.setId(String.valueOf(System.currentTimeMillis()));
            }
            
            timetable.setCreatedAt(LocalDateTime.now());
            timetable.setUpdatedAt(LocalDateTime.now());
            
            // Add the timetable to the new folder
            newFolder.addTimetable(timetable);
            
            // Save and return the new folder
            return examFolderRepository.save(newFolder);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return null;
        }
    }

    // Helper method to generate unique folder names
    private String generateUniqueFolderName(String userId, String baseName) {
        if (examFolderRepository == null) {
            return baseName + " (1)";
        }
        try {
            int counter = 1;
            String uniqueName;
            
            do {
                uniqueName = baseName + " (" + counter + ")";
                counter++;
            } while (getExamFolderByUserAndName(userId, uniqueName) != null);
            
            return uniqueName;
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return baseName + " (1)";
        }
    }

    public ExamFolder updateTimetableInFolder(String folderId, String timetableId, Timetable updatedTimetable) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
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
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return null;
    }

    public ExamFolder deleteTimetableFromFolder(String folderId, String timetableId) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
            Optional<ExamFolder> existingFolder = examFolderRepository.findById(folderId);
            if (existingFolder.isPresent()) {
                ExamFolder folder = existingFolder.get();
                
                if (folder.getTimetables() != null) {
                    folder.getTimetables().removeIf(timetable -> timetable.getId().equals(timetableId));
                    folder.setUpdatedAt(LocalDateTime.now());
                    return examFolderRepository.save(folder);
                }
            }
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
        return null;
    }

    public ExamFolder getExamFolderByUserAndName(String userId, String folderName) {
        if (examFolderRepository == null) {
            return null;
        }
        try {
            Optional<ExamFolder> folder = examFolderRepository.findByUserIdAndFolderName(userId, folderName);
            return folder.orElse(null);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return null;
        }
    }
}
