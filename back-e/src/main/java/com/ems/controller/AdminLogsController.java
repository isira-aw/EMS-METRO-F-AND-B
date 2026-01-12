package com.ems.controller;

import com.ems.dto.ActivityLogResponseDTO;
import com.ems.service.LogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Logs Controller
 * Handles viewing and filtering of activity logs for admin
 * Base path: /api/admin/logs
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLogsController {

    private final LogService logService;

    /**
     * Get all activity logs with optional filters
     * Supports filtering by employee and date range
     * Paginated and sorted by timestamp descending
     *
     * @param employeeId Optional employee ID filter (null for all employees)
     * @param startDate Optional start date filter (format: YYYY-MM-DD)
     * @param endDate Optional end date filter (format: YYYY-MM-DD)
     * @param page Page number (default 0)
     * @param size Page size (default 20)
     * @return Page of ActivityLogResponseDTO
     */
    @GetMapping
    public ResponseEntity<Page<ActivityLogResponseDTO>> getActivityLogs(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<ActivityLogResponseDTO> logs = logService.getFilteredLogs(employeeId, startDate, endDate, pageable);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get all activity logs without filters
     * Returns all logs across all employees and dates
     *
     * @param page Page number (default 0)
     * @param size Page size (default 20)
     * @return Page of ActivityLogResponseDTO
     */
    @GetMapping("/all")
    public ResponseEntity<Page<ActivityLogResponseDTO>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLogResponseDTO> logs = logService.getAllLogs(pageable);
        return ResponseEntity.ok(logs);
    }
}
