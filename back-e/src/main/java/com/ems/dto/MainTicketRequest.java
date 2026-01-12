package com.ems.dto;

import com.ems.entity.JobCardType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class MainTicketRequest {
    @NotNull(message = "Generator ID is required")
    private Long generatorId;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Type is required")
    private JobCardType type;
    
    @NotNull(message = "Weight is required")
    @Min(value = 1, message = "Weight must be between 1 and 5")
    @Max(value = 5, message = "Weight must be between 1 and 5")
    private Integer weight;
    
    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;
    
    @NotNull(message = "Scheduled time is required")
    private LocalTime scheduledTime;
    
    @NotEmpty(message = "At least one employee must be assigned")
    @Size(min = 1, max = 5, message = "Assign 1 to 5 employees")
    private List<Long> employeeIds;
}
