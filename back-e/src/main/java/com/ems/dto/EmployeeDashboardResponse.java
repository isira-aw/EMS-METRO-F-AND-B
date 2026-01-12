package com.ems.dto;

import com.ems.entity.MiniJobCard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Employee Dashboard Response DTO
 * Contains summary statistics for employee dashboard
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeDashboardResponse {

    // Job card statistics
    private Long pendingJobCardsCount;
    private Long inProgressJobCardsCount;
    private Long completedJobCardsCount;
    private Long totalJobCardsCount;

    // Time statistics (current month)
    private Integer totalWorkMinutes;
    private Integer totalOTMinutes;
    private Integer morningOTMinutes;
    private Integer eveningOTMinutes;

    // Performance statistics
    private Double averageScore;
    private Integer totalScores;

    // Recent activity
    private List<MiniJobCard> recentJobCards;

    // Additional info
    private Boolean dayStarted;
    private Boolean dayEnded;
    private String currentStatus;
}
