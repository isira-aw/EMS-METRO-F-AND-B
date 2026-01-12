package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "generators")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Generator {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String model;
    
    @Column(nullable = false)
    private String name;
    
    private String capacity;
    
    @Column(nullable = false)
    private String locationName;
    
    private String ownerEmail;

    private String whatsAppNumber;

    private String landlineNumber;

    @Column(length = 1000)
    private String note;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
