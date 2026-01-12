package com.ems.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class OTReportResponse {
    private String employeeName;
    private LocalDate date;
    private Integer morningOtMinutes;
    private Integer eveningOtMinutes;
    private Integer totalOtMinutes;
}
