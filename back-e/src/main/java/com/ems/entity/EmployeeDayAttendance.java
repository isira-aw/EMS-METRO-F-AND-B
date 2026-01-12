package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_day_attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDayAttendance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;
    
    @Column(nullable = false)
    private LocalDate date;
    
    private LocalDateTime dayStartTime;
    
    private LocalDateTime dayEndTime;
    
    private Integer totalWorkMinutes = 0;
    
    private Integer morningOtMinutes = 0;
    
    private Integer eveningOtMinutes = 0;
    
    @Column(unique = true)
    private String uniqueKey; // employeeId + date for unique constraint
}
