package com.example.ExamPilot.service;

import com.example.ExamPilot.model.User;
import com.example.ExamPilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @PostConstruct
    public void initializeAdminUser() {
        // Create admin user if it doesn't exist
        if (!userRepository.existsByUsername(adminUsername)) {
            User adminUser = new User(adminUsername, adminPassword);
            adminUser.setRole("ADMIN");
            userRepository.save(adminUser);
            System.out.println("Admin user created: " + adminUsername);
        }
    }

    public boolean authenticateUser(String username, String password) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && user.getPassword().equals(password)) {
            return true;
        }
        return false;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public User createUser(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        
        User user = new User(username, password);
        return userRepository.save(user);
    }
}
