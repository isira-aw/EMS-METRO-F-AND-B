package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * EmployeeScore Entity
 * Tracks performance scores for completed and approved mini job cards
 *
 * Business Rules:
 * - Can only be created after MiniJobCard is COMPLETED and APPROVED by admin
 * - Links to the specific MiniJobCard (actual work unit) not MainTicket
 * - workDate tracks when the work was actually completed (for daily reporting)
 * - Weight from MainTicket serves as the score (consolidated - no separate scoring)
 */
@Entity
@Table(name = "employee_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne
    @JoinColumn(name = "mini_job_card_id", nullable = false)
    private MiniJobCard miniJobCard;

    @Column(nullable = false)
    private LocalDate workDate; // Date when work was completed (from MiniJobCard.endTime)

    @Column(nullable = false)
    private Integer weight; // Job weight/score (1-5) from MainTicket - weight and score are the same

    @Column(nullable = false)
    private String approvedBy; // Admin username who approved the job

    @Column(nullable = false)
    private LocalDateTime approvedAt; // When job was approved
}
