package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "main_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MainTicket {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String ticketNumber;
    
    @ManyToOne
    @JoinColumn(name = "generator_id", nullable = false)
    private Generator generator;
    
    @Column(nullable = false)
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobCardType type;
    
    @Column(nullable = false)
    private Integer weight; // 1 to 5 (★ to ★★★★★)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status = JobStatus.PENDING;
    
    @Column(nullable = false)
    private LocalDate scheduledDate;
    
    @Column(nullable = false)
    private LocalTime scheduledTime;
    
    @Column(nullable = false)
    private String createdBy;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
