package com.example.ExamPilot.service;

import com.example.ExamPilot.model.User;
import com.example.ExamPilot.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    @Autowired(required = false)
    private UserRepository userRepository;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @PostConstruct
    public void initializeAdminUser() {
        if (userRepository == null) {
            System.out.println("MongoDB not available - skipping admin user initialization");
            return;
        }
        
        try {
            // Create admin user if it doesn't exist
            if (!userRepository.existsByUsername(adminUsername)) {
                User adminUser = new User(adminUsername, adminPassword);
                adminUser.setRole("ADMIN");
                userRepository.save(adminUser);
                System.out.println("Admin user created: " + adminUsername);
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize admin user (database not available): " + e.getMessage());
        }
    }

    public boolean authenticateUser(String username, String password) {
        if (userRepository == null) {
            // Fallback authentication when database is not available
            return adminUsername.equals(username) && adminPassword.equals(password);
        }
        
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null && user.getPassword().equals(password)) {
                return true;
            }
        } catch (Exception e) {
            System.err.println("Database error during authentication: " + e.getMessage());
            // Fallback to admin credentials
            return adminUsername.equals(username) && adminPassword.equals(password);
        }
        return false;
    }

    public User findByUsername(String username) {
        if (userRepository == null) {
            return null;
        }
        
        try {
            return userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            return null;
        }
    }

    public User createUser(String username, String password) {
        if (userRepository == null) {
            throw new RuntimeException("Database not available");
        }
        
        try {
            if (userRepository.existsByUsername(username)) {
                throw new RuntimeException("Username already exists");
            }
            
            User user = new User(username, password);
            return userRepository.save(user);
        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
            throw new RuntimeException("Failed to create user: " + e.getMessage());
        }
    }
}
