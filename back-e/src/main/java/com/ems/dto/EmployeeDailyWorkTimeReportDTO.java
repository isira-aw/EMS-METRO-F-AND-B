package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Employee Daily Work Time Report
 * Shows daily work hours, OT, and weight earned for a specific employee
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDailyWorkTimeReportDTO {

    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer morningOtMinutes;
    private Integer eveningOtMinutes;
    private Integer totalOtMinutes;
    private Integer workingMinutes;
    private Integer totalWeightEarned; // Weight earned only on this day
    private Integer jobsCompleted; // Number of jobs completed on this day
}
