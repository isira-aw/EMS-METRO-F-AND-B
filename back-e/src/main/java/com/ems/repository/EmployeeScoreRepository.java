package com.ems.repository;

import com.ems.entity.EmployeeScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeScoreRepository extends JpaRepository<EmployeeScore, Long> {

    // Find all scores for an employee
    List<EmployeeScore> findByEmployeeId(Long employeeId);

    // Find all scores for an employee within a date range
    List<EmployeeScore> findByEmployeeIdAndWorkDateBetween(
        Long employeeId,
        LocalDate startDate,
        LocalDate endDate
    );

    // Find score by mini job card ID
    Optional<EmployeeScore> findByMiniJobCardId(Long miniJobCardId);

    // Find scores by main ticket (via miniJobCard relationship)
    @Query("SELECT es FROM EmployeeScore es WHERE es.miniJobCard.mainTicket.id = :mainTicketId")
    List<EmployeeScore> findByMainTicketId(@Param("mainTicketId") Long mainTicketId);

    // Check if a mini job card already has a score
    boolean existsByMiniJobCardId(Long miniJobCardId);

    // Get total weight (score) for employee in date range
    // Note: weight and score are consolidated - weight IS the score
    @Query("SELECT COALESCE(SUM(es.weight), 0) FROM EmployeeScore es " +
           "WHERE es.employee.id = :employeeId " +
           "AND es.workDate BETWEEN :startDate AND :endDate")
    Integer getTotalWeightedScore(
        @Param("employeeId") Long employeeId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
