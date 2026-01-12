package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Daily Time Tracking Report
 * Shows employee time tracking details including location
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTimeTrackingReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private Integer dailyWorkingMinutes;
    private Integer idleMinutes;
    private Integer travelMinutes;
    private Integer totalMinutes;
    private List<LocationPoint> locationPath;

    /**
     * Represents a location point with coordinates
     */
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
