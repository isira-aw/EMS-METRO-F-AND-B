package com.ems.repository;

import com.ems.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    // Find all logs ordered by timestamp descending
    Page<ActivityLog> findAllByOrderByTimestampDesc(Pageable pageable);

    // Find logs by employee with pagination
    Page<ActivityLog> findByEmployeeIdOrderByTimestampDesc(Long employeeId, Pageable pageable);

    // Find logs by employee and date range
    @Query("SELECT al FROM ActivityLog al WHERE al.employee.id = :employeeId AND al.timestamp BETWEEN :startDate AND :endDate ORDER BY al.timestamp DESC")
    Page<ActivityLog> findByEmployeeIdAndDateRange(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // Find all logs within date range
    @Query("SELECT al FROM ActivityLog al WHERE al.timestamp BETWEEN :startDate AND :endDate ORDER BY al.timestamp DESC")
    Page<ActivityLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // Find logs for a specific mini job card
    List<ActivityLog> findByMiniJobCardIdOrderByTimestampDesc(Long miniJobCardId);

    // Find recent logs for an employee
    List<ActivityLog> findTop10ByEmployeeIdOrderByTimestampDesc(Long employeeId);
}
