package com.example.ExamPilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@SpringBootApplication
@EnableMongoAuditing
public class ExamSchedulerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamSchedulerApplication.class, args);
    }
}