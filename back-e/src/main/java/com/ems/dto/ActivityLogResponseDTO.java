package com.ems.dto;

import com.ems.entity.ActivityType;
import com.ems.entity.JobStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogResponseDTO {
    private Long id;

    // Employee information
    private Long employeeId;
    private String employeeFullName;
    private String employeeEmail;

    // Performer/Generator information (person who did the action)
    private Long performerId;
    private String performerFullName;
    private String performerEmail;

    // Activity details
    private ActivityType activityType;
    private String activityDescription;

    // Related entities
    private Long miniJobCardId;
    private Long mainTicketId;
    private String ticketNumber;
    private Long generatorId;
    private String generatorName;
    private String generatorLocationName;

    // Status information
    private JobStatus oldStatus;
    private JobStatus newStatus;

    // Location information
    private Double latitude;
    private Double longitude;
    private String locationMapUrl;

    // Additional details
    private String details;

    // Timestamp
    private LocalDateTime timestamp;
    private String formattedDate;
    private String formattedTime;
}
