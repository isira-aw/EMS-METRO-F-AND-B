package com.ems.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GeneratorRequest {
    @NotBlank(message = "Model is required")
    private String model;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    private String capacity;
    
    @NotBlank(message = "Location name is required")
    private String locationName;
    
    private String ownerEmail;
    private String whatsAppNumber;
    private String landlineNumber;
    private String note;
}
