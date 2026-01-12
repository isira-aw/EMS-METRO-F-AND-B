package com.ems.controller;

import com.ems.dto.StatusUpdateRequest;
import com.ems.entity.JobStatusLog;
import com.ems.entity.MiniJobCard;
import com.ems.service.TicketService;
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
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Employee Job Card Controller
 * Handles mini job card operations for employees
 * Base path: /api/employee/job-cards
 * Security: EMPLOYEE role required
 */
@RestController
@RequestMapping("/api/employee/job-cards")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeJobCardController {

    private final TicketService ticketService;

    /**
     * Get all job cards assigned to current employee
     * Paginated and sorted by creation date descending
     *
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MiniJobCard records
     */
    @GetMapping
    public ResponseEntity<Page<MiniJobCard>> getMyJobCards(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MiniJobCard> jobCards = ticketService.getJobCardsByEmployee(username, pageable);
        return ResponseEntity.ok(jobCards);
    }

    /**
     * Get specific job card by ID
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param auth Spring Security authentication
     * @return MiniJobCard details
     */
    @GetMapping("/{id}")
    public ResponseEntity<MiniJobCard> getJobCardById(
            @PathVariable Long id,
            Authentication auth) {

        String username = auth.getName();
        MiniJobCard jobCard = ticketService.getJobCardByIdForEmployee(id, username);
        return ResponseEntity.ok(jobCard);
    }

    /**
     * Update job card status
     * Creates audit log with geolocation
     * Validates status transition rules
     * Calculates work minutes
     *
     * @param id Mini job card ID
     * @param request Status update request (newStatus, latitude, longitude)
     * @param auth Spring Security authentication
     * @return Updated MiniJobCard
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<MiniJobCard> updateJobCardStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication auth) {

        String username = auth.getName();
        MiniJobCard updated = ticketService.updateJobStatus(id, request, username);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get status logs for a job card
     * Shows complete audit trail with geolocation
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param auth Spring Security authentication
     * @return List of JobStatusLog records ordered by time
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<JobStatusLog>> getJobCardLogs(
            @PathVariable Long id,
            Authentication auth) {

        String username = auth.getName();
        // First validate employee owns this job card
        ticketService.getJobCardByIdForEmployee(id, username);

        // Then get logs
        List<JobStatusLog> logs = ticketService.getJobStatusLogs(id);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get job cards by status
     * Useful for filtering pending, in-progress, or completed jobs
     *
     * @param status Job status filter
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of filtered MiniJobCard records
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<MiniJobCard>> getJobCardsByStatus(
            @PathVariable String status,
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MiniJobCard> jobCards = ticketService.getJobCardsByEmployeeAndStatus(username, status, pageable);
        return ResponseEntity.ok(jobCards);
    }

    /**
     * Get job cards by scheduled date
     * Returns only job cards scheduled for a specific date
     * Sorted by scheduled time in ascending order
     *
     * @param date Scheduled date to filter by
     * @param status Optional status filter
     * @param auth Spring Security authentication
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of filtered MiniJobCard records
     */
    @GetMapping("/by-date")
    public ResponseEntity<Page<MiniJobCard>> getJobCardsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String username = auth.getName();
        Pageable pageable = PageRequest.of(page, size);
        Page<MiniJobCard> jobCards = ticketService.getJobCardsByEmployeeAndDate(username, date, status, pageable);
        return ResponseEntity.ok(jobCards);
    }

    /**
     * Get pending job cards count
     * Quick endpoint for badge notifications
     *
     * @param auth Spring Security authentication
     * @return Count of pending job cards
     */
    @GetMapping("/pending/count")
    public ResponseEntity<Long> getPendingCount(Authentication auth) {
        String username = auth.getName();
        Long count = ticketService.getTodayPendingJobCards(username);
        return ResponseEntity.ok(count);
    }

    /**
     * Upload image for a job card as base64
     * Only one image per job card is allowed
     * Validates that job card belongs to current employee
     *
     * @param id Mini job card ID
     * @param file Image file to upload
     * @param auth Spring Security authentication
     * @return Success response with confirmation
     */
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        try {
            String username = auth.getName();

            // Validate employee owns this job card
            ticketService.getJobCardByIdForEmployee(id, username);

            // Validate file
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            // Validate image type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }

            // Convert to base64
            byte[] imageBytes = file.getBytes();
            String base64Image = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(imageBytes);

            // Update job card with base64 image
            ticketService.updateJobCardImage(id, base64Image);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Image uploaded successfully");
            response.put("success", "true");

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            Map<String, String> response = new HashMap<>();
            response.put("message", ex.getMessage());
            response.put("success", "false");
            return ResponseEntity.badRequest().body(response);
        }
    }
}
