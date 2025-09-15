package com.example.ExamPilot.controller;

import com.example.ExamPilot.model.User;
import com.example.ExamPilot.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestHeader("Authorization") String authHeader) {
        try {
            // Parse Basic Auth header
            if (authHeader == null || !authHeader.startsWith("Basic ")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authorization header"));
            }

            String base64Credentials = authHeader.substring("Basic ".length());
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] parts = credentials.split(":", 2);

            if (parts.length != 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials format"));
            }

            String username = parts[0];
            String password = parts[1];

            boolean isAuthenticated = userService.authenticateUser(username, password);

            if (isAuthenticated) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("username", username);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String base64Credentials = authHeader.substring("Basic ".length());
            String credentials = new String(Base64.getDecoder().decode(base64Credentials));
            String[] parts = credentials.split(":", 2);
            
            if (parts.length != 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid credentials format"));
            }

            String username = parts[0];
            User user = userService.findByUsername(username);
            
            if (user != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("role", user.getRole());
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get user: " + e.getMessage()));
        }
    }
}
