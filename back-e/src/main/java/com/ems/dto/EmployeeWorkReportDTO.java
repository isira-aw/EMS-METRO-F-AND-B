package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Employee Work Report DTO
 * Comprehensive daily work report for an employee including:
 * - Attendance (check-in/out, work hours, OT)
 * - Jobs worked on (generators/machines)
 * - Performance scores
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeWorkReportDTO {

    // Employee Information
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;

    // Report Period
    private LocalDate reportStartDate;
    private LocalDate reportEndDate;

    // Daily Work Records
    private List<DailyWorkRecord> dailyRecords;

    // Summary Statistics
    private SummaryStatistics summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyWorkRecord {
        // Date
        private LocalDate date;

        // Attendance
        private LocalDateTime checkInTime;
        private LocalDateTime checkOutTime;
        private Integer totalWorkMinutes;

        // Overtime
        private Integer morningOtMinutes;
        private Integer eveningOtMinutes;
        private Integer totalOtMinutes;

        // Jobs & Generators
        private List<JobDetail> jobs;

        // Daily Score
        private Integer dailyScore;          // Sum of (score * weight) for this day
        private Integer dailyTotalWeight;    // Sum of weights for this day
        private Double dailyAverageScore;    // dailyScore / dailyTotalWeight
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobDetail {
        private Long miniJobCardId;
        private Long mainTicketId;
        private String ticketNumber;
        private String ticketTitle;
        private String jobType;
        private String jobStatus;

        // Generator/Machine Details
        private Long generatorId;
        private String generatorName;
        private String generatorModel;
        private String generatorLocation;

        // Work Time
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer workMinutes;

        // Score
        private Integer weight;
        private Integer score;
        private Integer weightedScore;      // score * weight
        private Boolean scored;             // Has score been assigned?
        private Boolean approved;           // Has job been approved?
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStatistics {
        // Overall Period Stats
        private Integer totalDaysWorked;
        private Integer totalWorkMinutes;
        private Integer totalOtMinutes;

        // Job Stats
        private Integer totalJobsCompleted;
        private Integer totalJobsScored;
        private Integer totalJobsPending;

        // Score Stats
        private Integer totalWeightedScore;  // Sum of all (score * weight)
        private Integer totalWeight;         // Sum of all weights
        private Double overallAverageScore;  // totalWeightedScore / totalWeight
        private Integer maxDailyScore;
        private Integer minDailyScore;
        private Double averageDailyScore;
    }
}
