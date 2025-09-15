package com.example.ExamPilot.model;

public class TimetableDay {
    
    private String date;
    private String day;
    private ExamSession morning;
    private ExamSession afternoon;
    
    // Constructors
    public TimetableDay() {}
    
    public TimetableDay(String date, String day, ExamSession morning, ExamSession afternoon) {
        this.date = date;
        this.day = day;
        this.morning = morning;
        this.afternoon = afternoon;
    }
    
    // Getters and Setters
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public String getDay() {
        return day;
    }
    
    public void setDay(String day) {
        this.day = day;
    }
    
    public ExamSession getMorning() {
        return morning;
    }
    
    public void setMorning(ExamSession morning) {
        this.morning = morning;
    }
    
    public ExamSession getAfternoon() {
        return afternoon;
    }
    
    public void setAfternoon(ExamSession afternoon) {
        this.afternoon = afternoon;
    }
}

class ExamSession {
    private String id;
    private String name;
    private String duration;
    private String credits;
    private String time;
    private String session;
    private String code;
    
    // Constructors
    public ExamSession() {}
    
    public ExamSession(String name, String duration, String credits, String time, String session, String code) {
        this.name = name;
        this.duration = duration;
        this.credits = credits;
        this.time = time;
        this.session = session;
        this.code = code;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDuration() {
        return duration;
    }
    
    public void setDuration(String duration) {
        this.duration = duration;
    }
    
    public String getCredits() {
        return credits;
    }
    
    public void setCredits(String credits) {
        this.credits = credits;
    }
    
    public String getTime() {
        return time;
    }
    
    public void setTime(String time) {
        this.time = time;
    }
    
    public String getSession() {
        return session;
    }
    
    public void setSession(String session) {
        this.session = session;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
}
