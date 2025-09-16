package com.example.ExamPilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;

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
    
    @Bean
    public MongoClient mongoClient() {
        try {
            if (uri != null && !uri.isEmpty()) {
                // Remove unsupported options and create a clean connection string
                String cleanUri = uri.replaceAll("&tlsAllowInvalidCertificates=true", "")
                                    .replaceAll("&tlsallowinvalidcertificates=true", "");
                
                MongoClientSettings settings = MongoClientSettings.builder()
                    .applyConnectionString(new ConnectionString(cleanUri))
                    .build();
                
                return MongoClients.create(settings);
            }
        } catch (Exception e) {
            System.err.println("Failed to connect to MongoDB Atlas: " + e.getMessage());
            System.err.println("Application will continue without database connectivity.");
        }
        
        // Return a mock client or handle gracefully
        return null;
    }
    
    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory() {
        try {
            MongoClient client = mongoClient();
            if (client != null) {
                return new SimpleMongoClientDatabaseFactory(client, "exam_scheduler");
            }
        } catch (Exception e) {
            System.err.println("Failed to create MongoDB factory: " + e.getMessage());
        }
        return null;
    }
    
    @Bean
    public MongoTemplate mongoTemplate() {
        try {
            MongoDatabaseFactory factory = mongoDatabaseFactory();
            if (factory != null) {
                return new MongoTemplate(factory);
            }
        } catch (Exception e) {
            System.err.println("Failed to create MongoTemplate: " + e.getMessage());
        }
        return null;
    }
}
