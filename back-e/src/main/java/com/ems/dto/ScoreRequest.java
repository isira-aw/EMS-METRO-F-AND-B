package com.ems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Score Request DTO
 * Used by admin to approve a mini job card and automatically assign score based on weight
 *
 * Business Rule: MiniJobCard must be COMPLETED and APPROVED
 * Score is automatically set to the MainTicket's weight value (1-5)
 */
@Data
public class ScoreRequest {
    @NotNull(message = "Mini Job Card ID is required")
    private Long miniJobCardId;
}
