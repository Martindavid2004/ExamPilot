package com.example.ExamPilot.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
@ConditionalOnClass(MongoTemplate.class)
@EnableMongoAuditing
public class MongoAuditingConfig {
    // This configuration will only be enabled if MongoTemplate is available
}