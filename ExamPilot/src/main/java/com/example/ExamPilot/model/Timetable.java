package com.example.ExamPilot.model;

import java.time.LocalDateTime;
import java.util.List;

public class Timetable {
    private String id;
    private String tableName;
    private String startDate;
    private String endDate;
    private Integer dayGap;
    private List<TimetableDay> timetable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Constructors
    public Timetable() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTableName() { return tableName; }
    public void setTableName(String tableName) { this.tableName = tableName; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public Integer getDayGap() { return dayGap; }
    public void setDayGap(Integer dayGap) { this.dayGap = dayGap; }

    public List<TimetableDay> getTimetable() { return timetable; }
    public void setTimetable(List<TimetableDay> timetable) { this.timetable = timetable; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Inner classes for timetable structure
    public static class TimetableDay {
        private String date;
        private String day;
        private ExamSession morning;
        private ExamSession afternoon;

        // Getters and Setters
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public String getDay() { return day; }
        public void setDay(String day) { this.day = day; }

        public ExamSession getMorning() { return morning; }
        public void setMorning(ExamSession morning) { this.morning = morning; }

        public ExamSession getAfternoon() { return afternoon; }
        public void setAfternoon(ExamSession afternoon) { this.afternoon = afternoon; }
    }

    public static class ExamSession {
        private String name;
        private String duration;
        private String credits;
        private String time;
        private String session;
        private String code;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getCredits() { return credits; }
        public void setCredits(String credits) { this.credits = credits; }

        public String getTime() { return time; }
        public void setTime(String time) { this.time = time; }

        public String getSession() { return session; }
        public void setSession(String session) { this.session = session; }

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }
}
