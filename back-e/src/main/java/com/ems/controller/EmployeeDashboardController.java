package com.ems.controller;

import com.ems.dto.EmployeeDashboardResponse;
import com.ems.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Employee Dashboard Controller
 * Provides summary statistics and dashboard data for employees
 * Base path: /api/employee/dashboard
 * Security: EMPLOYEE role required
 */
@RestController
@RequestMapping("/api/employee/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeDashboardController {

    private final TicketService ticketService;

    /**
     * Get dashboard summary for current employee
     * Includes:
     * - Pending job cards count
     * - In-progress job cards count
     * - Completed job cards count
     * - Total work minutes (current month)
     * - Total OT minutes (current month)
     * - Average performance score
     * - Recent job cards (last 5)
     *
     * @param auth Spring Security authentication
     * @return EmployeeDashboardResponse with all statistics
     */
    @GetMapping("/summary")
    public ResponseEntity<EmployeeDashboardResponse> getDashboardSummary(Authentication auth) {
        String username = auth.getName();
        EmployeeDashboardResponse dashboard = ticketService.getEmployeeDashboard(username);
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Get monthly statistics for current employee
     * Work hours, OT hours, jobs completed in specified month
     *
     * @param year Year (e.g., 2024)
     * @param month Month (1-12)
     * @param auth Spring Security authentication
     * @return Monthly statistics
     */
    @GetMapping("/monthly-stats")
    public ResponseEntity<?> getMonthlyStats(
            @RequestParam int year,
            @RequestParam int month,
            Authentication auth) {

        String username = auth.getName();
        var stats = ticketService.getEmployeeMonthlyStats(username, year, month);
        return ResponseEntity.ok(stats);
    }
}
