package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Employee who performed the action or whom the action was performed on
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private User employee;

    // Person who initiated/performed the action (e.g., admin who approved, employee who updated status)
    @ManyToOne
    @JoinColumn(name = "performer_id")
    private User performer;

    // Type of activity
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType activityType;

    // Related mini job card (if applicable)
    @ManyToOne
    @JoinColumn(name = "mini_job_card_id")
    private MiniJobCard miniJobCard;

    // Related main ticket (if applicable)
    @ManyToOne
    @JoinColumn(name = "main_ticket_id")
    private MainTicket mainTicket;

    // Generator information (if applicable)
    @ManyToOne
    @JoinColumn(name = "generator_id")
    private Generator generator;

    // Old status (for status updates)
    @Enumerated(EnumType.STRING)
    private JobStatus oldStatus;

    // New status (for status updates)
    @Enumerated(EnumType.STRING)
    private JobStatus newStatus;

    // Location data
    private Double latitude;

    private Double longitude;

    // Additional details/description
    @Column(length = 1000)
    private String details;

    // Timestamp of the activity
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
