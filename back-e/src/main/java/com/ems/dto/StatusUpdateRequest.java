package com.ems.dto;

import com.ems.entity.JobStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "New status is required")
    private JobStatus newStatus;

    @NotNull(message = "Latitude is required - please enable location services")
    private Double latitude;

    @NotNull(message = "Longitude is required - please enable location services")
    private Double longitude;
}
