package com.ems.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TimeTrackingReportResponse {
    private String employeeName;
    private LocalDate date;
    private LocalDateTime dayStartTime;
    private LocalDateTime dayEndTime;
    private Integer workMinutes;
    private Integer idleMinutes;
    private Integer travelMinutes;
    private Integer totalMinutes;
}
