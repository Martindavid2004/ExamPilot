package com.example.ExamPilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "spring.data.mongodb")
public class MongoConfig {
    
    private String uri;
    
    public String getUri() {
        return uri;
    }
    
    public void setUri(String uri) {
        this.uri = uri;
    }
}
