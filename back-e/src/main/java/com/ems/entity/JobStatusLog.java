package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_status_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobStatusLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "mini_job_card_id", nullable = false)
    private MiniJobCard miniJobCard;
    
    @Column(nullable = false)
    private String employeeEmail;
    
    @Enumerated(EnumType.STRING)
    private JobStatus prevStatus;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus newStatus;
    
    private Double latitude;
    
    private Double longitude;
    
    @Column(nullable = false)
    private LocalDateTime loggedAt;
}
