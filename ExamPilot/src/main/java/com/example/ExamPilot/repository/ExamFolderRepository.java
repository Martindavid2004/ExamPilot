package com.example.ExamPilot.repository;

import com.example.ExamPilot.model.ExamFolder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamFolderRepository extends MongoRepository<ExamFolder, String> {
    List<ExamFolder> findByUserId(String userId);
    Optional<ExamFolder> findByUserIdAndFolderName(String userId, String folderName);
    void deleteByUserId(String userId);
}

