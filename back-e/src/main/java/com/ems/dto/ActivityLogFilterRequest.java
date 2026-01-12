package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogFilterRequest {
    private Long employeeId; // null for "all employees"
    private String startDate; // ISO date format: YYYY-MM-DD
    private String endDate;   // ISO date format: YYYY-MM-DD
    private Integer page;     // Default 0
    private Integer size;     // Default 20
}
