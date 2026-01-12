package com.ems.controller;

import com.ems.dto.DailyTimeTrackingReportDTO;
import com.ems.dto.EmployeeDailyWorkTimeReportDTO;
import com.ems.dto.OTReportResponse;
import com.ems.dto.TimeTrackingReportResponse;
import com.ems.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Admin Report Controller
 * Handles all reporting and analytics endpoints
 * Base path: /api/admin/reports
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    /**
     * Get time tracking report
     * Shows work minutes, travel minutes, idle minutes by employee and date
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter (null = all employees)
     * @return List of TimeTrackingReportResponse
     */
    @GetMapping("/time-tracking")
    public ResponseEntity<List<TimeTrackingReportResponse>> getTimeTrackingReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        List<TimeTrackingReportResponse> report =
            reportService.getTimeTrackingReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get overtime report
     * Shows morning OT, evening OT, and total OT by employee and date
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter (null = all employees)
     * @return List of OTReportResponse
     */
    @GetMapping("/overtime")
    public ResponseEntity<List<OTReportResponse>> getOvertimeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        List<OTReportResponse> report = reportService.getOTReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get OT breakdown by generator
     * Shows total OT spent on each generator with employee details
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return Map of generator info to OT totals
     */
    @GetMapping("/overtime-by-generator")
    public ResponseEntity<?> getOTReportByGenerator(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        var report = reportService.getOTReportByGenerator(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get employee performance score report
     * Shows weighted scores, average, total tickets scored
     *
     * @param employeeId Employee user ID
     * @return Performance score summary
     */
    @GetMapping("/employee-score/{employeeId}")
    public ResponseEntity<?> getEmployeeScoreReport(@PathVariable Long employeeId) {
        var report = reportService.getEmployeeScoreReport(employeeId);
        return ResponseEntity.ok(report);
    }

    /**
     * Get ticket completion report
     * Shows tickets completed vs pending by date range
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return Completion statistics
     */
    @GetMapping("/ticket-completion")
    public ResponseEntity<?> getTicketCompletionReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        var report = reportService.getTicketCompletionReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get employee productivity report
     * Shows tickets completed, avg completion time, total work hours
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter
     * @return Productivity metrics
     */
    @GetMapping("/employee-productivity")
    public ResponseEntity<?> getEmployeeProductivityReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        var report = reportService.getEmployeeProductivityReport(startDate, endDate, employeeId);
        return ResponseEntity.ok(report);
    }

    /**
     * Get generator service history report
     * Shows all tickets for a generator with completion stats
     *
     * @param generatorId Generator ID
     * @return Service history and statistics
     */
    @GetMapping("/generator-service-history/{generatorId}")
    public ResponseEntity<?> getGeneratorServiceHistory(@PathVariable Long generatorId) {
        var report = reportService.getGeneratorServiceHistory(generatorId);
        return ResponseEntity.ok(report);
    }

    /**
     * Get daily attendance summary
     * Shows who worked, total hours, OT hours by date
     *
     * @param date Specific date to report on
     * @return Daily attendance summary
     */
    @GetMapping("/daily-attendance")
    public ResponseEntity<?> getDailyAttendanceReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        var report = reportService.getDailyAttendanceReport(date);
        return ResponseEntity.ok(report);
    }

    /**
     * Get monthly summary report
     * Comprehensive report for a specific month
     * Includes tickets, employees, OT, productivity
     *
     * @param year Year (e.g., 2024)
     * @param month Month (1-12)
     * @return Monthly summary
     */
    @GetMapping("/monthly-summary")
    public ResponseEntity<?> getMonthlySummaryReport(
            @RequestParam int year,
            @RequestParam int month) {

        var report = reportService.getMonthlySummaryReport(year, month);
        return ResponseEntity.ok(report);
    }

    /**
     * Export time tracking report as CSV
     * Downloads CSV file with time tracking data
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter
     * @return CSV file content
     */
    @GetMapping("/time-tracking/export")
    public ResponseEntity<byte[]> exportTimeTrackingReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        byte[] csv = reportService.exportTimeTrackingReportCSV(employeeId, startDate, endDate);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=time-tracking-report.csv")
            .body(csv);
    }

    /**
     * Export overtime report as CSV
     * Downloads CSV file with OT data
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter
     * @return CSV file content
     */
    @GetMapping("/overtime/export")
    public ResponseEntity<byte[]> exportOvertimeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        byte[] csv = reportService.exportOTReportCSV(employeeId, startDate, endDate);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=overtime-report.csv")
            .body(csv);
    }

    /**
     * Get real-time dashboard statistics
     * Current active jobs, employees working, pending approvals
     *
     * @return Real-time statistics map
     */
    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = reportService.getDashboardStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get comprehensive employee work report
     *
     * Returns detailed daily breakdown including:
     * - Attendance (check-in/out, work hours, OT hours)
     * - Jobs worked on (tickets, generators, work time)
     * - Performance scores (daily and total)
     * - Summary statistics for the period
     *
     * Use Case: Monthly/weekly employee performance review, payroll calculation
     *
     * @param employeeId Employee user ID (required)
     * @param startDate Report start date (inclusive)
     * @param endDate Report end date (inclusive)
     * @return EmployeeWorkReportDTO with complete work details
     */
    @GetMapping("/employee-work-report/{employeeId}")
    public ResponseEntity<com.ems.dto.EmployeeWorkReportDTO> getEmployeeWorkReport(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        com.ems.dto.EmployeeWorkReportDTO report =
            reportService.getEmployeeWorkReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get Daily Time Tracking Report
     * Shows employee time tracking with location, working time, idle time, travel time
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param employeeId Optional employee filter (null = all employees)
     * @return List of DailyTimeTrackingReportDTO
     */
    @GetMapping("/daily-time-tracking")
    public ResponseEntity<List<DailyTimeTrackingReportDTO>> getDailyTimeTrackingReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long employeeId) {

        List<DailyTimeTrackingReportDTO> report =
            reportService.getDailyTimeTrackingReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get Employee Daily Work Time Report
     * Shows daily work hours, OT hours, and weight earned for a specific employee
     *
     * @param employeeId Employee ID (required)
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @return List of EmployeeDailyWorkTimeReportDTO
     */
    @GetMapping("/employee-daily-work-time/{employeeId}")
    public ResponseEntity<List<EmployeeDailyWorkTimeReportDTO>> getEmployeeDailyWorkTimeReport(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<EmployeeDailyWorkTimeReportDTO> report =
            reportService.getEmployeeDailyWorkTimeReport(employeeId, startDate, endDate);
        return ResponseEntity.ok(report);
    }
}
