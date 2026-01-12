package com.ems.controller;

import com.ems.dto.MainTicketRequest;
import com.ems.entity.MainTicket;
import com.ems.entity.MiniJobCard;
import com.ems.entity.TicketAssignment;
import com.ems.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;

/**
 * Admin Ticket Controller
 * Handles all ticket and assignment operations
 * Base path: /api/admin/tickets
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTicketController {

    private final TicketService ticketService;

    /**
     * Create new main ticket with employee assignments
     * Auto-generates mini job cards for each assigned employee
     *
     * @param request MainTicketRequest DTO with employee IDs
     * @param auth Spring Security authentication
     * @return Created MainTicket entity
     */
    @PostMapping
    public ResponseEntity<MainTicket> createTicket(
            @Valid @RequestBody MainTicketRequest request,
            Authentication auth) {

        String createdBy = auth.getName();
        MainTicket ticket = ticketService.createMainTicket(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    /**
     * Get all tickets
     * Paginated and sorted
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @param sortBy Field to sort by (default "createdAt")
     * @param sortDir Sort direction (default "desc")
     * @return Page of MainTicket entities
     */
    @GetMapping
    public ResponseEntity<Page<MainTicket>> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MainTicket> tickets = ticketService.getAllMainTickets(pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get ticket by ID
     * Returns full ticket details with generator info
     *
     * @param id Ticket ID
     * @return MainTicket entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<MainTicket> getTicketById(@PathVariable Long id) {
        MainTicket ticket = ticketService.getMainTicketById(id);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Update ticket details
     * Can update title, description, type, weight, scheduled date/time
     *
     * @param id Ticket ID
     * @param request MainTicketRequest DTO
     * @param auth Spring Security authentication
     * @return Updated MainTicket entity
     */
    @PutMapping("/{id}")
    public ResponseEntity<MainTicket> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody MainTicketRequest request,
            Authentication auth) {

        String updatedBy = auth.getName();
        MainTicket ticket = ticketService.updateMainTicket(id, request, updatedBy);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Delete ticket
     * Only allowed if all mini job cards are in PENDING status
     *
     * @param id Ticket ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Long id) {
        ticketService.deleteMainTicket(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all mini job cards for a ticket
     * Shows all employee assignments and their progress
     *
     * @param id Ticket ID
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MiniJobCard entities
     */
    @GetMapping("/{id}/mini-jobs")
    public ResponseEntity<Page<MiniJobCard>> getMiniJobCardsByTicket(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<MiniJobCard> miniJobs = ticketService.getMiniJobCardsByTicketId(id, pageable);
        return ResponseEntity.ok(miniJobs);
    }

    /**
     * Get all ticket assignments
     * Shows which employees are assigned to the ticket
     *
     * @param id Ticket ID
     * @return List of TicketAssignment entities
     */
    @GetMapping("/{id}/assignments")
    public ResponseEntity<List<TicketAssignment>> getTicketAssignments(@PathVariable Long id) {
        List<TicketAssignment> assignments = ticketService.getTicketAssignments(id);
        return ResponseEntity.ok(assignments);
    }

    /**
     * Add employee to existing ticket
     * Creates new mini job card for the employee
     *
     * @param ticketId Ticket ID
     * @param employeeId Employee user ID
     * @param auth Spring Security authentication
     * @return Created MiniJobCard
     */
    @PostMapping("/{ticketId}/assign/{employeeId}")
    public ResponseEntity<MiniJobCard> assignEmployeeToTicket(
            @PathVariable Long ticketId,
            @PathVariable Long employeeId,
            Authentication auth) {

        String assignedBy = auth.getName();
        MiniJobCard miniJob = ticketService.assignEmployeeToTicket(ticketId, employeeId, assignedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(miniJob);
    }

    /**
     * Remove employee from ticket
     * Only allowed if mini job card is PENDING or CANCEL
     *
     * @param ticketId Ticket ID
     * @param employeeId Employee user ID
     * @return No content
     */
    @DeleteMapping("/{ticketId}/unassign/{employeeId}")
    public ResponseEntity<Void> unassignEmployeeFromTicket(
            @PathVariable Long ticketId,
            @PathVariable Long employeeId) {

        ticketService.unassignEmployeeFromTicket(ticketId, employeeId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get tickets by status
     * Filter by PENDING, STARTED, COMPLETED, etc.
     *
     * @param status Job status
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MainTicket entities
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<MainTicket>> getTicketsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MainTicket> tickets = ticketService.getTicketsByStatus(status, pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get tickets by date range
     * Filters by scheduled date
     *
     * @param startDate Start date (inclusive)
     * @param endDate End date (inclusive)
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MainTicket entities
     */
    @GetMapping("/date-range")
    public ResponseEntity<Page<MainTicket>> getTicketsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("scheduledDate").ascending());
        Page<MainTicket> tickets = ticketService.getTicketsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get tickets created by specific admin
     *
     * @param createdBy Username of admin who created tickets
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MainTicket entities
     */
    @GetMapping("/created-by/{createdBy}")
    public ResponseEntity<Page<MainTicket>> getTicketsByCreator(
            @PathVariable String createdBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MainTicket> tickets = ticketService.getTicketsByCreator(createdBy, pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Cancel ticket
     * Sets status to CANCEL for main ticket and all mini job cards
     *
     * @param id Ticket ID
     * @return Updated MainTicket
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<MainTicket> cancelTicket(@PathVariable Long id) {
        MainTicket ticket = ticketService.cancelTicket(id);
        return ResponseEntity.ok(ticket);
    }

    /**
     * Send custom notification to generator owner
     * Admin can send custom message via Email and/or WhatsApp
     *
     * @param id Ticket ID
     * @param request SendNotificationRequest with message and delivery preferences
     * @return Success message
     */
    @PostMapping("/{id}/send-notification")
    public ResponseEntity<?> sendNotificationToOwner(
            @PathVariable Long id,
            @Valid @RequestBody com.ems.dto.SendNotificationRequest request) {
        try {
            ticketService.sendCustomNotificationToOwner(
                id,
                request.getMessage(),
                request.isSendEmail(),
                request.isSendWhatsApp()
            );

            String deliveryMethod = "";
            if (request.isSendEmail() && request.isSendWhatsApp()) {
                deliveryMethod = "Email and WhatsApp";
            } else if (request.isSendEmail()) {
                deliveryMethod = "Email";
            } else if (request.isSendWhatsApp()) {
                deliveryMethod = "WhatsApp";
            }

            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Notification sent successfully via " + deliveryMethod
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
