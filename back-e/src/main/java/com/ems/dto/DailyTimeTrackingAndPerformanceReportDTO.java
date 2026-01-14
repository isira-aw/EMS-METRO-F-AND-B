package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Merged DTO combining Daily Time Tracking and Performance & OT Report
 * Provides comprehensive daily overview with all metrics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTimeTrackingAndPerformanceReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;

    // Time breakdown
    private Integer dailyWorkingMinutes;      // STARTED + TRAVELING
    private Integer idleMinutes;              // ON_HOLD
    private Integer travelMinutes;            // TRAVELING (shown separately)
    private Integer totalMinutes;             // Regular work hours (8:30 AM - 5:30 PM)

    // OT breakdown
    private Integer morningOtMinutes;         // Before 8:30 AM
    private Integer eveningOtMinutes;         // After 5:30 PM
    private Integer totalOtMinutes;           // morning + evening

    // Performance metrics
    private Integer jobsCompleted;            // Number of jobs completed
    private Integer totalWeightEarned;        // Total weight/score earned
    private Double averageScore;              // Average score for the day

    // Location tracking
    private List<LocationPoint> locationPath;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationPoint {
        private Double latitude;
        private Double longitude;
        private LocalDateTime timestamp;
    }
}
