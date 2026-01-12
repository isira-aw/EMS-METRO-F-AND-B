package com.ems.repository;

import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeDayAttendanceRepository extends JpaRepository<EmployeeDayAttendance, Long> {
    Optional<EmployeeDayAttendance> findByEmployeeAndDate(User employee, LocalDate date);
    List<EmployeeDayAttendance> findByEmployeeAndDateBetween(User employee, LocalDate startDate, LocalDate endDate);
    Optional<EmployeeDayAttendance> findByUniqueKey(String uniqueKey);
}
