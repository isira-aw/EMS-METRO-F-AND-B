package com.ems.controller;

import com.ems.entity.EmployeeDayAttendance;
import com.ems.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Employee Attendance Controller
 * Handles all employee attendance-related operations
 * Base path: /api/employee/attendance
 * Security: EMPLOYEE role required
 */
@RestController
@RequestMapping("/api/employee/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeAttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Start work day for current employee
     * Creates attendance record with day start time
     * Calculates morning OT if before 8:30 AM
     *
     * @param auth Spring Security authentication
     * @return Created EmployeeDayAttendance record
     */
    @PostMapping("/start")
    public ResponseEntity<EmployeeDayAttendance> startDay(Authentication auth) {
        String username = auth.getName();
        EmployeeDayAttendance attendance = attendanceService.startDay(username);
        return ResponseEntity.ok(attendance);
    }

    /**
     * End work day for current employee
     * Updates attendance record with day end time
     * Calculates evening OT if after 5:30 PM
     *
     * @param auth Spring Security authentication
     * @return Updated EmployeeDayAttendance record
     */
    @PostMapping("/end")
    public ResponseEntity<EmployeeDayAttendance> endDay(Authentication auth) {
        String username = auth.getName();
        EmployeeDayAttendance attendance = attendanceService.endDay(username);
        return ResponseEntity.ok(attendance);
    }

    /**
     * Get today's attendance status
     * Shows if employee has started/ended their day
     *
     * @param auth Spring Security authentication
     * @return Today's EmployeeDayAttendance record or null if not started
     */
    @GetMapping("/today")
    public ResponseEntity<EmployeeDayAttendance> getTodayStatus(Authentication auth) {
        String username = auth.getName();
        EmployeeDayAttendance attendance = attendanceService.getTodayAttendance(username);
        return ResponseEntity.ok(attendance);
    }

    /**
     * Get attendance history for current employee
     * Paginated and sorted by date descending
     *
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of EmployeeDayAttendance records
     */
    @GetMapping("/history")
    public ResponseEntity<Page<EmployeeDayAttendance>> getAttendanceHistory(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("date").descending());
        Page<EmployeeDayAttendance> history = attendanceService.getAttendanceHistory(username, pageable);
        return ResponseEntity.ok(history);
    }

    /**
     * Get attendance by date range
     * Useful for employee to view their own attendance records
     *
     * @param auth Spring Security authentication
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return List of EmployeeDayAttendance records
     */
    @GetMapping("/range")
    public ResponseEntity<?> getAttendanceByDateRange(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String username = auth.getName();
        var attendanceList = attendanceService.getAttendanceByDateRange(username, startDate, endDate);
        return ResponseEntity.ok(attendanceList);
    }
}
