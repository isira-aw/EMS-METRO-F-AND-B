package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Employee Achievement Report
 * Shows ticket-level daily progress and achievements
 * Tracks individual ticket performance throughout the day
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeAchievementReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime dayStartTime;
    private LocalDateTime dayEndTime;

    // Daily summary
    private DailySummary dailySummary;

    // List of tickets worked on this day
    private List<TicketAchievement> ticketAchievements;

    /**
     * Daily summary of all tickets
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySummary {
        private Integer totalTickets;
        private Integer completedTickets;
        private Integer pendingTickets;
        private Integer totalWorkMinutes;          // Sum of all ticket work time
        private Integer totalTravelMinutes;        // Sum of all travel time
        private Integer totalIdleMinutes;          // Sum of all idle time
        private Integer totalWeightEarned;         // Sum of all scores
        private Integer morningOtMinutes;
        private Integer eveningOtMinutes;
        private Integer totalOtMinutes;
    }

    /**
     * Individual ticket achievement details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketAchievement {
        private Long miniJobCardId;
        private Long mainTicketId;
        private String ticketNumber;
        private String ticketTitle;
        private String jobType;

        // Generator details
        private String generatorName;
        private String generatorModel;
        private String generatorLocation;

        // Time tracking
        private LocalDateTime startTime;         // First status change (TRAVELING or STARTED)
        private LocalDateTime endTime;           // COMPLETED time
        private Integer workMinutes;             // STARTED + TRAVELING time
        private Integer travelMinutes;           // TRAVELING time only
        private Integer idleMinutes;             // ON_HOLD time

        // Status and performance
        private String currentStatus;
        private Integer weight;                  // Score (1-5)
        private Boolean scored;
        private Boolean approved;

        // Detailed time breakdown
        private List<StatusDuration> statusBreakdown;
    }

    /**
     * Time spent in each status
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusDuration {
        private String status;
        private Integer minutes;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }
}
