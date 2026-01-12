package com.ems.service;

import com.ems.config.TimeZoneConfig;
import com.ems.dto.EmployeeDashboardResponse;
import com.ems.dto.MainTicketRequest;
import com.ems.dto.StatusUpdateRequest;
import com.ems.entity.*;
import com.ems.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketService {
    
    @Autowired
    private MainTicketRepository mainTicketRepository;
    
    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    @Autowired
    private TicketAssignmentRepository ticketAssignmentRepository;
    
    @Autowired
    private JobStatusLogRepository jobStatusLogRepository;
    
    @Autowired
    private GeneratorRepository generatorRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private EmployeeScoreRepository employeeScoreRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private TimeZoneConfig timeZoneConfig;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public MainTicket createMainTicket(MainTicketRequest request, String createdBy) {
        Generator generator = generatorRepository.findById(request.getGeneratorId())
                .orElseThrow(() -> new RuntimeException("Generator not found"));
        
        MainTicket mainTicket = new MainTicket();
        mainTicket.setTicketNumber("TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        mainTicket.setGenerator(generator);
        mainTicket.setTitle(request.getTitle());
        mainTicket.setDescription(request.getDescription());
        mainTicket.setType(request.getType());
        mainTicket.setWeight(request.getWeight());
        mainTicket.setScheduledDate(request.getScheduledDate());
        mainTicket.setScheduledTime(request.getScheduledTime());
        mainTicket.setCreatedBy(createdBy);
        mainTicket.setStatus(JobStatus.PENDING);
        
        mainTicket = mainTicketRepository.save(mainTicket);
        
        for (Long employeeId : request.getEmployeeIds()) {
            User employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
            
            if (employee.getRole() != UserRole.EMPLOYEE) {
                throw new RuntimeException("User " + employee.getUsername() + " is not an employee");
            }
            
            TicketAssignment assignment = new TicketAssignment();
            assignment.setMainTicket(mainTicket);
            assignment.setEmployee(employee);
            ticketAssignmentRepository.save(assignment);
            
            MiniJobCard miniJobCard = new MiniJobCard();
            miniJobCard.setMainTicket(mainTicket);
            miniJobCard.setEmployee(employee);
            miniJobCard.setStatus(JobStatus.PENDING);
            miniJobCard.setApproved(false);
            miniJobCard.setWorkMinutes(0);
            miniJobCardRepository.save(miniJobCard);
        }
        
        return mainTicket;
    }
    
    public Page<MainTicket> getAllMainTickets(Pageable pageable) {
        return mainTicketRepository.findAll(pageable);
    }
    
    public MainTicket getMainTicketById(Long id) {
        return mainTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));
    }
    
    public List<MiniJobCard> getMiniJobCardsByTicketId(Long mainTicketId) {
        return miniJobCardRepository.findByMainTicketId(mainTicketId);
    }
    
    @Transactional
    public MiniJobCard updateJobStatus(Long miniJobCardId, StatusUpdateRequest request, String employeeUsername) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));

        User employee = userRepository.findByUsername(employeeUsername)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!miniJobCard.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("Unauthorized: This job card doesn't belong to you");
        }

        // Employee Status Update Restriction: Only allow updating status for tickets scheduled for today
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDate ticketScheduledDate = miniJobCard.getMainTicket().getScheduledDate();
        if (!ticketScheduledDate.equals(today)) {
            throw new RuntimeException("Cannot update status for tickets not scheduled for today. This ticket is scheduled for " +
                    ticketScheduledDate + ". Only tickets scheduled for today (" + today + ") can be updated.");
        }

        if (!attendanceService.hasDayStarted(employee)) {
            throw new RuntimeException("Please start your day first");
        }

        if (attendanceService.hasDayEnded(employee)) {
            throw new RuntimeException("Cannot update status after day has ended");
        }

        validateStatusTransition(miniJobCard.getStatus(), request.getNewStatus());

        // Single Active Ticket Rule: Only one ticket can be active at a time per day
        // Check if employee is trying to activate this ticket (change to TRAVELING, STARTED, or ON_HOLD)
        if (request.getNewStatus() == JobStatus.TRAVELING ||
            request.getNewStatus() == JobStatus.STARTED ||
            request.getNewStatus() == JobStatus.ON_HOLD) {

            // Check if there's already another active ticket scheduled for TODAY
            List<MiniJobCard> allEmployeeCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();
            boolean hasActiveTicket = allEmployeeCards.stream()
                    .filter(card -> !card.getId().equals(miniJobCardId)) // Exclude current ticket
                    .filter(card -> card.getMainTicket().getScheduledDate().equals(today)) // Only check tickets scheduled for today
                    .anyMatch(card -> card.getStatus() == JobStatus.TRAVELING ||
                                     card.getStatus() == JobStatus.STARTED ||
                                     card.getStatus() == JobStatus.ON_HOLD);

            if (hasActiveTicket) {
                throw new RuntimeException("You already have an active ticket in progress. Please complete or cancel it before starting another ticket.");
            }
        }

        // Validate location data
        validateLocationData(request.getLatitude(), request.getLongitude());

        LocalDateTime now = LocalDateTime.now(timeZoneConfig.getZoneId());
        
        JobStatusLog log = new JobStatusLog();
        log.setMiniJobCard(miniJobCard);
        log.setEmployeeEmail(employee.getEmail());
        log.setPrevStatus(miniJobCard.getStatus());
        log.setNewStatus(request.getNewStatus());
        log.setLatitude(request.getLatitude());
        log.setLongitude(request.getLongitude());
        log.setLoggedAt(now);
        jobStatusLogRepository.save(log);

        // Log status update to activity log
        logService.logStatusUpdate(employee, miniJobCard, miniJobCard.getStatus(), request.getNewStatus(),
                request.getLatitude(), request.getLongitude());

        miniJobCard.setStatus(request.getNewStatus());
        
        if (request.getNewStatus() == JobStatus.STARTED && miniJobCard.getStartTime() == null) {
            miniJobCard.setStartTime(now);
        }
        
        if (request.getNewStatus() == JobStatus.COMPLETED && miniJobCard.getEndTime() == null) {
            miniJobCard.setEndTime(now);
            calculateWorkMinutes(miniJobCard);
        }
        
        miniJobCard = miniJobCardRepository.save(miniJobCard);
        updateMainTicketStatus(miniJobCard.getMainTicket().getId());
        
        return miniJobCard;
    }
    
    private void calculateWorkMinutes(MiniJobCard miniJobCard) {
        List<JobStatusLog> logs = jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(miniJobCard.getId());
        
        int totalWorkMinutes = 0;
        LocalDateTime startedTime = null;
        
        for (int i = logs.size() - 1; i >= 0; i--) {
            JobStatusLog log = logs.get(i);
            
            if (log.getNewStatus() == JobStatus.STARTED) {
                startedTime = log.getLoggedAt();
            } else if ((log.getNewStatus() == JobStatus.ON_HOLD || log.getNewStatus() == JobStatus.COMPLETED) && startedTime != null) {
                long minutes = Duration.between(startedTime, log.getLoggedAt()).toMinutes();
                totalWorkMinutes += minutes;
                startedTime = null;
            }
        }
        
        miniJobCard.setWorkMinutes(totalWorkMinutes);
    }
    
    private void updateMainTicketStatus(Long mainTicketId) {
        List<MiniJobCard> miniJobCards = miniJobCardRepository.findByMainTicketId(mainTicketId);
        MainTicket mainTicket = mainTicketRepository.findById(mainTicketId)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));

        boolean allCompleted = miniJobCards.stream()
                .allMatch(mjc -> mjc.getStatus() == JobStatus.COMPLETED || mjc.getStatus() == JobStatus.CANCEL);

        boolean anyStarted = miniJobCards.stream()
                .anyMatch(mjc -> mjc.getStatus() == JobStatus.STARTED ||
                                mjc.getStatus() == JobStatus.TRAVELING ||
                                mjc.getStatus() == JobStatus.ON_HOLD);

        if (allCompleted) {
            mainTicket.setStatus(JobStatus.COMPLETED);
        } else if (anyStarted) {
            mainTicket.setStatus(JobStatus.STARTED);
        }

        mainTicketRepository.save(mainTicket);
    }

    // Manual notification method - called by admin from UI
    public void sendCustomNotificationToOwner(Long mainTicketId, String customMessage, boolean sendEmail, boolean sendWhatsApp) {
        MainTicket mainTicket = mainTicketRepository.findById(mainTicketId)
                .orElseThrow(() -> new RuntimeException("Main ticket not found"));

        Generator generator = mainTicket.getGenerator();
        String ownerEmail = generator.getOwnerEmail();
        String ownerPhone = generator.getWhatsAppNumber();

        // Send via email if requested and email is available
        if (sendEmail && ownerEmail != null && !ownerEmail.isEmpty()) {
            try {
                notificationService.sendCustomEmail(ownerEmail, mainTicket.getTicketNumber(), generator.getName(), customMessage);
            } catch (Exception e) {
                throw new RuntimeException("Failed to send email: " + e.getMessage());
            }
        }

        // Send via WhatsApp if requested and phone is available
        if (sendWhatsApp && ownerPhone != null && !ownerPhone.isEmpty()) {
            try {
                notificationService.sendCustomWhatsApp(ownerPhone, mainTicket.getTicketNumber(), generator.getName(), customMessage);
            } catch (Exception e) {
                throw new RuntimeException("Failed to send WhatsApp message: " + e.getMessage());
            }
        }

        if (!sendEmail && !sendWhatsApp) {
            throw new RuntimeException("Please select at least one notification method (Email or WhatsApp)");
        }
    }
    
    private void validateStatusTransition(JobStatus current, JobStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == JobStatus.TRAVELING || next == JobStatus.CANCEL;
            case TRAVELING -> next == JobStatus.STARTED || next == JobStatus.ON_HOLD || next == JobStatus.CANCEL;
            case STARTED -> next == JobStatus.ON_HOLD || next == JobStatus.COMPLETED || next == JobStatus.CANCEL;
            case ON_HOLD -> next == JobStatus.STARTED || next == JobStatus.CANCEL;
            case COMPLETED, CANCEL -> false;
        };

        if (!valid) {
            throw new RuntimeException("Invalid status transition from " + current + " to " + next);
        }
    }

    private void validateLocationData(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new RuntimeException("Location is required. Please enable location services on your device.");
        }

        // Validate latitude range (-90 to 90)
        if (latitude < -90 || latitude > 90) {
            throw new RuntimeException("Invalid latitude value. Please ensure location services are working properly.");
        }

        // Validate longitude range (-180 to 180)
        if (longitude < -180 || longitude > 180) {
            throw new RuntimeException("Invalid longitude value. Please ensure location services are working properly.");
        }

        // Check for default/zero values that might indicate location not properly captured
        if (latitude == 0.0 && longitude == 0.0) {
            throw new RuntimeException("Invalid location detected. Please ensure location services are enabled and try again.");
        }
    }
    
    @Transactional
    public MiniJobCard approveMiniJobCard(Long miniJobCardId) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));
        
        if (miniJobCard.getStatus() != JobStatus.COMPLETED) {
            throw new RuntimeException("Can only approve completed job cards");
        }
        
        miniJobCard.setApproved(true);
        return miniJobCardRepository.save(miniJobCard);
    }
    
    /**
     * Assign score to an approved mini job card
     * Score is automatically set to the MainTicket's weight value
     *
     * Business Rules:
     * 1. MiniJobCard must exist
     * 2. MiniJobCard must be COMPLETED
     * 3. MiniJobCard must be APPROVED by admin
     * 4. Cannot assign score twice to the same job card
     * 5. Score equals weight from MainTicket (1-5)
     *
     * @param miniJobCardId The mini job card ID
     * @param adminUsername Admin who is assigning the score
     * @return Created EmployeeScore entity
     */
    @Transactional
    public EmployeeScore assignScore(Long miniJobCardId, String adminUsername) {
        // 1. Fetch mini job card
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found with ID: " + miniJobCardId));

        // 2. Validate job card is completed
        if (miniJobCard.getStatus() != JobStatus.COMPLETED) {
            throw new RuntimeException("Cannot assign score to a job card that is not completed. " +
                    "Current status: " + miniJobCard.getStatus());
        }

        // 3. Validate job card is approved
        if (!miniJobCard.getApproved()) {
            throw new RuntimeException("Cannot assign score to an unapproved job card. " +
                    "Please approve the job card first before assigning a score.");
        }

        // 4. Check if score already exists
        if (employeeScoreRepository.existsByMiniJobCardId(miniJobCardId)) {
            throw new RuntimeException("Score already assigned to this job card. " +
                    "Use update score endpoint to modify existing scores.");
        }

        // 5. Validate endTime exists to calculate workDate
        if (miniJobCard.getEndTime() == null) {
            throw new RuntimeException("Cannot assign score: job card has no end time recorded.");
        }

        // 6. Create new score - weight from MainTicket is used as the score
        Integer weight = miniJobCard.getMainTicket().getWeight();

        EmployeeScore employeeScore = new EmployeeScore();
        employeeScore.setEmployee(miniJobCard.getEmployee());
        employeeScore.setMiniJobCard(miniJobCard);
        employeeScore.setWorkDate(miniJobCard.getEndTime().toLocalDate());
        employeeScore.setWeight(weight); // Weight and score are the same
        employeeScore.setApprovedBy(adminUsername);
        employeeScore.setApprovedAt(LocalDateTime.now(timeZoneConfig.getZoneId()));

        return employeeScoreRepository.save(employeeScore);
    }
    
    public List<JobStatusLog> getJobStatusLogs(Long miniJobCardId) {
        return jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(miniJobCardId);
    }

    // Employee job card methods
    public Page<MiniJobCard> getJobCardsByEmployee(String username, Pageable pageable) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get all job cards and sort by scheduled date and time (priority ordering)
        List<MiniJobCard> allCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();
        List<MiniJobCard> sortedCards = allCards.stream()
                .sorted((a, b) -> {
                    // Sort by scheduled date first, then by scheduled time
                    int dateCompare = a.getMainTicket().getScheduledDate()
                            .compareTo(b.getMainTicket().getScheduledDate());
                    if (dateCompare != 0) {
                        return dateCompare;
                    }
                    return a.getMainTicket().getScheduledTime()
                            .compareTo(b.getMainTicket().getScheduledTime());
                })
                .collect(Collectors.toList());

        // Apply pagination to sorted list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), sortedCards.size());
        List<MiniJobCard> pageContent = start >= sortedCards.size() ? List.of() : sortedCards.subList(start, end);
        return new PageImpl<>(pageContent, pageable, sortedCards.size());
    }

    public MiniJobCard getJobCardByIdForEmployee(Long id, String username) {
        MiniJobCard jobCard = miniJobCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job card not found"));

        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!jobCard.getEmployee().getId().equals(employee.getId())) {
            throw new RuntimeException("Unauthorized: This job card doesn't belong to you");
        }

        return jobCard;
    }

    public Page<MiniJobCard> getJobCardsByEmployeeAndStatus(String username, String status, Pageable pageable) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        JobStatus jobStatus = JobStatus.valueOf(status.toUpperCase());

        // Get all job cards with the specified status and sort by scheduled date and time (priority ordering)
        List<MiniJobCard> allCards = miniJobCardRepository.findByEmployeeAndStatus(employee, jobStatus, Pageable.unpaged()).getContent();
        List<MiniJobCard> sortedCards = allCards.stream()
                .sorted((a, b) -> {
                    // Sort by scheduled date first, then by scheduled time
                    int dateCompare = a.getMainTicket().getScheduledDate()
                            .compareTo(b.getMainTicket().getScheduledDate());
                    if (dateCompare != 0) {
                        return dateCompare;
                    }
                    return a.getMainTicket().getScheduledTime()
                            .compareTo(b.getMainTicket().getScheduledTime());
                })
                .collect(Collectors.toList());

        // Apply pagination to sorted list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), sortedCards.size());
        List<MiniJobCard> pageContent = start >= sortedCards.size() ? List.of() : sortedCards.subList(start, end);
        return new PageImpl<>(pageContent, pageable, sortedCards.size());
    }

    public Page<MiniJobCard> getJobCardsByEmployeeAndDate(String username, LocalDate date, String status, Pageable pageable) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get all job cards for the employee
        List<MiniJobCard> allCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();

        // Filter by scheduled date
        List<MiniJobCard> filteredCards = allCards.stream()
                .filter(card -> card.getMainTicket().getScheduledDate().equals(date))
                .collect(Collectors.toList());

        // Apply status filter if provided
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            JobStatus jobStatus = JobStatus.valueOf(status.toUpperCase());
            filteredCards = filteredCards.stream()
                    .filter(card -> card.getStatus() == jobStatus)
                    .collect(Collectors.toList());
        }

        // Sort by scheduled time (ascending order)
        List<MiniJobCard> sortedCards = filteredCards.stream()
                .sorted((a, b) -> a.getMainTicket().getScheduledTime()
                        .compareTo(b.getMainTicket().getScheduledTime()))
                .collect(Collectors.toList());

        // Apply pagination to sorted list
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), sortedCards.size());
        List<MiniJobCard> pageContent = start >= sortedCards.size() ? List.of() : sortedCards.subList(start, end);
        return new PageImpl<>(pageContent, pageable, sortedCards.size());
    }


    public long getTodayPendingJobCards(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return miniJobCardRepository.countByEmployeeAndMainTicket_ScheduledDateAndStatus(
                employee,
                LocalDate.now(),
                JobStatus.PENDING
        );
    }

    public EmployeeDashboardResponse getEmployeeDashboard(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<MiniJobCard> allCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();

        long pendingCount = allCards.stream().filter(c -> c.getStatus() == JobStatus.PENDING).count();
        long inProgressCount = allCards.stream().filter(c ->
                c.getStatus() == JobStatus.TRAVELING ||
                c.getStatus() == JobStatus.STARTED ||
                c.getStatus() == JobStatus.ON_HOLD
        ).count();
        long completedCount = allCards.stream().filter(c -> c.getStatus() == JobStatus.COMPLETED).count();

        // Get current month stats
        LocalDate now = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDate monthStart = now.withDayOfMonth(1);

        int totalWorkMinutes = allCards.stream()
                .filter(c -> c.getEndTime() != null &&
                        c.getEndTime().toLocalDate().isAfter(monthStart.minusDays(1)) &&
                        c.getEndTime().toLocalDate().isBefore(now.plusDays(1)))
                .mapToInt(MiniJobCard::getWorkMinutes)
                .sum();

        // Get scores
        List<EmployeeScore> scores = employeeScoreRepository.findByEmployeeId(employee.getId());
        double avgScore = scores.stream()
                .mapToDouble(EmployeeScore::getWeight) // Weight is the score
                .average()
                .orElse(0.0);

        // Recent job cards
        List<MiniJobCard> recentCards = allCards.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList());

        boolean dayStarted = attendanceService.hasDayStarted(employee);
        boolean dayEnded = attendanceService.hasDayEnded(employee);

        EmployeeDashboardResponse dashboard = new EmployeeDashboardResponse();
        dashboard.setPendingJobCardsCount(pendingCount);
        dashboard.setInProgressJobCardsCount(inProgressCount);
        dashboard.setCompletedJobCardsCount(completedCount);
        dashboard.setTotalJobCardsCount((long) allCards.size());
        dashboard.setTotalWorkMinutes(totalWorkMinutes);
        dashboard.setTotalOTMinutes(0); // Would need attendance calculation
        dashboard.setMorningOTMinutes(0);
        dashboard.setEveningOTMinutes(0);
        dashboard.setAverageScore(avgScore);
        dashboard.setTotalScores(scores.size());
        dashboard.setRecentJobCards(recentCards);
        dashboard.setDayStarted(dayStarted);
        dashboard.setDayEnded(dayEnded);
        dashboard.setCurrentStatus(dayStarted && !dayEnded ? "ACTIVE" : "INACTIVE");

        return dashboard;
    }

    public Map<String, Object> getEmployeeMonthlyStats(String username, int year, int month) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<MiniJobCard> cards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(c -> c.getCreatedAt().toLocalDate().isAfter(startDate.minusDays(1)) &&
                        c.getCreatedAt().toLocalDate().isBefore(endDate.plusDays(1)))
                .collect(Collectors.toList());

        int totalWorkMinutes = cards.stream()
                .mapToInt(MiniJobCard::getWorkMinutes)
                .sum();

        long completedJobs = cards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("year", year);
        stats.put("month", month);
        stats.put("totalWorkMinutes", totalWorkMinutes);
        stats.put("completedJobs", completedJobs);
        stats.put("totalJobs", cards.size());

        return stats;
    }

    // Admin ticket methods
    public Page<MiniJobCard> getMiniJobCardsByTicketId(Long ticketId, Pageable pageable) {
        List<MiniJobCard> cards = miniJobCardRepository.findByMainTicketId(ticketId);
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), cards.size());
        List<MiniJobCard> pageContent = start >= cards.size() ? List.of() : cards.subList(start, end);
        return new PageImpl<>(pageContent, pageable, cards.size());
    }

    public List<TicketAssignment> getTicketAssignments(Long ticketId) {
        return ticketAssignmentRepository.findByMainTicketId(ticketId);
    }

    @Transactional
    public MiniJobCard assignEmployeeToTicket(Long ticketId, Long employeeId, String assignedBy) {
        MainTicket ticket = mainTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (employee.getRole() != UserRole.EMPLOYEE) {
            throw new RuntimeException("User is not an employee");
        }

        // Check if already assigned
        List<TicketAssignment> existing = ticketAssignmentRepository.findByMainTicketId(ticketId);
        boolean alreadyAssigned = existing.stream()
                .anyMatch(ta -> ta.getEmployee().getId().equals(employeeId));

        if (alreadyAssigned) {
            throw new RuntimeException("Employee already assigned to this ticket");
        }

        TicketAssignment assignment = new TicketAssignment();
        assignment.setMainTicket(ticket);
        assignment.setEmployee(employee);
        ticketAssignmentRepository.save(assignment);

        MiniJobCard miniJobCard = new MiniJobCard();
        miniJobCard.setMainTicket(ticket);
        miniJobCard.setEmployee(employee);
        miniJobCard.setStatus(JobStatus.PENDING);
        miniJobCard.setApproved(false);
        miniJobCard.setWorkMinutes(0);

        return miniJobCardRepository.save(miniJobCard);
    }

    @Transactional
    public void unassignEmployeeFromTicket(Long ticketId, Long employeeId) {
        List<MiniJobCard> cards = miniJobCardRepository.findByMainTicketId(ticketId);
        MiniJobCard card = cards.stream()
                .filter(c -> c.getEmployee().getId().equals(employeeId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Employee not assigned to this ticket"));

        if (card.getStatus() != JobStatus.PENDING && card.getStatus() != JobStatus.CANCEL) {
            throw new RuntimeException("Cannot unassign employee with status: " + card.getStatus());
        }

        miniJobCardRepository.delete(card);

        List<TicketAssignment> assignments = ticketAssignmentRepository.findByMainTicketId(ticketId);
        assignments.stream()
                .filter(ta -> ta.getEmployee().getId().equals(employeeId))
                .findFirst()
                .ifPresent(ticketAssignmentRepository::delete);
    }

    public Page<MainTicket> getTicketsByStatus(String status, Pageable pageable) {
        JobStatus jobStatus = JobStatus.valueOf(status.toUpperCase());
        return mainTicketRepository.findByStatus(jobStatus, pageable);
    }

    public Page<MainTicket> getTicketsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return mainTicketRepository.findByScheduledDateBetween(startDate, endDate, pageable);
    }

    public Page<MainTicket> getTicketsByCreator(String createdBy, Pageable pageable) {
        return mainTicketRepository.findByCreatedBy(createdBy, pageable);
    }

    @Transactional
    public MainTicket cancelTicket(Long id) {
        MainTicket ticket = mainTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setStatus(JobStatus.CANCEL);
        mainTicketRepository.save(ticket);

        // Cancel all mini job cards
        List<MiniJobCard> cards = miniJobCardRepository.findByMainTicketId(id);
        cards.forEach(card -> {
            if (card.getStatus() != JobStatus.COMPLETED) {
                card.setStatus(JobStatus.CANCEL);
                miniJobCardRepository.save(card);
            }
        });

        return ticket;
    }

    @Transactional
    public MainTicket updateMainTicket(Long id, MainTicketRequest request, String updatedBy) {
        MainTicket ticket = mainTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Note: Admins can edit tickets from any date (no date restriction for admins)

        Generator generator = generatorRepository.findById(request.getGeneratorId())
                .orElseThrow(() -> new RuntimeException("Generator not found"));

        ticket.setGenerator(generator);
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setType(request.getType());
        ticket.setWeight(request.getWeight());
        ticket.setScheduledDate(request.getScheduledDate());
        ticket.setScheduledTime(request.getScheduledTime());

        ticket = mainTicketRepository.save(ticket);

        // Update employee assignments if provided
        if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
            // Get current assignments
            List<TicketAssignment> currentAssignments = ticketAssignmentRepository.findByMainTicketId(id);
            Set<Long> currentEmployeeIds = currentAssignments.stream()
                    .map(ta -> ta.getEmployee().getId())
                    .collect(Collectors.toSet());

            Set<Long> requestedEmployeeIds = new HashSet<>(request.getEmployeeIds());

            // Remove assignments for employees not in the new list (only if PENDING or CANCEL)
            for (TicketAssignment assignment : currentAssignments) {
                Long empId = assignment.getEmployee().getId();
                if (!requestedEmployeeIds.contains(empId)) {
                    // Find the mini job card for this employee
                    List<MiniJobCard> cards = miniJobCardRepository.findByMainTicketId(id);
                    MiniJobCard card = cards.stream()
                            .filter(c -> c.getEmployee().getId().equals(empId))
                            .findFirst()
                            .orElse(null);

                    if (card != null) {
                        if (card.getStatus() == JobStatus.PENDING || card.getStatus() == JobStatus.CANCEL) {
                            // Safe to remove
                            miniJobCardRepository.delete(card);
                            ticketAssignmentRepository.delete(assignment);
                        } else {
                            throw new RuntimeException("Cannot unassign employee " + assignment.getEmployee().getFullName() +
                                    " - job card status is " + card.getStatus());
                        }
                    }
                }
            }

            // Add new assignments
            for (Long employeeId : requestedEmployeeIds) {
                if (!currentEmployeeIds.contains(employeeId)) {
                    User employee = userRepository.findById(employeeId)
                            .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

                    if (employee.getRole() != UserRole.EMPLOYEE) {
                        throw new RuntimeException("User " + employee.getUsername() + " is not an employee");
                    }

                    // Create assignment
                    TicketAssignment assignment = new TicketAssignment();
                    assignment.setMainTicket(ticket);
                    assignment.setEmployee(employee);
                    ticketAssignmentRepository.save(assignment);

                    // Create mini job card
                    MiniJobCard miniJobCard = new MiniJobCard();
                    miniJobCard.setMainTicket(ticket);
                    miniJobCard.setEmployee(employee);
                    miniJobCard.setStatus(JobStatus.PENDING);
                    miniJobCard.setApproved(false);
                    miniJobCard.setWorkMinutes(0);
                    miniJobCardRepository.save(miniJobCard);
                }
            }
        }

        return ticket;
    }

    @Transactional
    public void deleteMainTicket(Long id) {
        MainTicket ticket = mainTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        List<MiniJobCard> cards = miniJobCardRepository.findByMainTicketId(id);
        boolean hasNonPending = cards.stream()
                .anyMatch(c -> c.getStatus() != JobStatus.PENDING && c.getStatus() != JobStatus.CANCEL);

        if (hasNonPending) {
            throw new RuntimeException("Cannot delete ticket with active job cards");
        }

        // Delete mini job cards
        miniJobCardRepository.deleteAll(cards);

        // Delete assignments
        List<TicketAssignment> assignments = ticketAssignmentRepository.findByMainTicketId(id);
        ticketAssignmentRepository.deleteAll(assignments);

        // Delete ticket
        mainTicketRepository.delete(ticket);
    }

    public Page<MainTicket> getTicketsByGenerator(Long generatorId, Pageable pageable) {
        Generator generator = generatorRepository.findById(generatorId)
                .orElseThrow(() -> new RuntimeException("Generator not found"));

        List<MainTicket> tickets = mainTicketRepository.findAll().stream()
                .filter(t -> t.getGenerator().getId().equals(generatorId))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), tickets.size());
        List<MainTicket> pageContent = start >= tickets.size() ? List.of() : tickets.subList(start, end);
        return new PageImpl<>(pageContent, pageable, tickets.size());
    }

    // Approval methods
    public Page<MiniJobCard> getPendingApprovals(Pageable pageable) {
        List<MiniJobCard> allCards = miniJobCardRepository.findAll();
        List<MiniJobCard> pending = allCards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED && !c.getApproved())
                .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), pending.size());
        List<MiniJobCard> pageContent = start >= pending.size() ? List.of() : pending.subList(start, end);
        return new PageImpl<>(pageContent, pageable, pending.size());
    }

    @Transactional
    public MiniJobCard approveMiniJobCard(Long miniJobCardId, String approvedBy) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));

        if (miniJobCard.getStatus() != JobStatus.COMPLETED) {
            throw new RuntimeException("Can only approve completed job cards");
        }

        miniJobCard.setApproved(true);
        MiniJobCard saved = miniJobCardRepository.save(miniJobCard);

        updateMainTicketStatus(miniJobCard.getMainTicket().getId());

        // Log approval activity
        User approver = userRepository.findByUsername(approvedBy).orElse(null);
        logService.logJobApproval(approver != null ? approver : miniJobCard.getEmployee(),
                miniJobCard.getEmployee(), miniJobCard);

        // Automatically create EmployeeScore when approving
        // Only create if score doesn't already exist and endTime is set
        if (!employeeScoreRepository.existsByMiniJobCardId(miniJobCardId) &&
            miniJobCard.getEndTime() != null) {
            try {
                EmployeeScore employeeScore = new EmployeeScore();
                employeeScore.setEmployee(miniJobCard.getEmployee());
                employeeScore.setMiniJobCard(miniJobCard);
                employeeScore.setWorkDate(miniJobCard.getEndTime().toLocalDate());
                employeeScore.setWeight(miniJobCard.getMainTicket().getWeight());
                employeeScore.setApprovedBy(approvedBy);
                employeeScore.setApprovedAt(LocalDateTime.now(timeZoneConfig.getZoneId()));
                employeeScoreRepository.save(employeeScore);
            } catch (Exception e) {
                // Log but don't fail approval if score creation fails
                System.err.println("Warning: Failed to create EmployeeScore for job card " + miniJobCardId + ": " + e.getMessage());
            }
        }

        return saved;
    }

    @Transactional
    public MiniJobCard rejectMiniJobCard(Long id, String rejectionNote, String rejectedBy) {
        MiniJobCard card = miniJobCardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mini job card not found"));

        if (card.getStatus() != JobStatus.COMPLETED) {
            throw new RuntimeException("Can only reject completed job cards");
        }

        card.setStatus(JobStatus.ON_HOLD);
        card.setApproved(false);

        return miniJobCardRepository.save(card);
    }

    @Transactional
    public List<MiniJobCard> bulkApproveMiniJobCards(List<Long> ids, String approvedBy) {
        List<MiniJobCard> approved = new ArrayList<>();

        for (Long id : ids) {
            try {
                MiniJobCard card = approveMiniJobCard(id, approvedBy);
                approved.add(card);
            } catch (Exception e) {
                // Skip cards that can't be approved
            }
        }

        return approved;
    }

    public List<EmployeeScore> getScoresByTicket(Long ticketId) {
        return employeeScoreRepository.findByMainTicketId(ticketId);
    }

    public List<EmployeeScore> getScoresByEmployee(Long employeeId) {
        return employeeScoreRepository.findByEmployeeId(employeeId);
    }

    @Transactional
    public EmployeeScore updateScore(Long scoreId, int newWeight, String updatedBy) {
        EmployeeScore score = employeeScoreRepository.findById(scoreId)
                .orElseThrow(() -> new RuntimeException("Score not found"));

        if (newWeight < 1 || newWeight > 5) {
            throw new RuntimeException("Weight/Score must be between 1 and 5");
        }

        score.setWeight(newWeight); // Weight and score are the same
        score.setApprovedBy(updatedBy);
        score.setApprovedAt(LocalDateTime.now(timeZoneConfig.getZoneId()));

        return employeeScoreRepository.save(score);
    }

    @Transactional
    public void deleteScore(Long scoreId) {
        EmployeeScore score = employeeScoreRepository.findById(scoreId)
                .orElseThrow(() -> new RuntimeException("Score not found"));
        employeeScoreRepository.delete(score);
    }

    public Map<String, Object> getApprovalStatistics() {
        List<MiniJobCard> allCards = miniJobCardRepository.findAll();

        long pending = allCards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED && !c.getApproved())
                .count();

        long approved = allCards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED && c.getApproved())
                .count();

        long rejected = allCards.stream()
                .filter(c -> c.getStatus() == JobStatus.ON_HOLD)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingApprovals", pending);
        stats.put("approvedJobs", approved);
        stats.put("rejectedJobs", rejected);
        stats.put("totalCompleted", pending + approved);

        return stats;
    }

    /**
     * Backfill EmployeeScore records for approved jobs that don't have scores
     * Useful for fixing data where jobs were approved before automatic score creation was implemented
     *
     * @param adminUsername Admin performing the backfill
     * @return Number of scores created
     */
    @Transactional
    public int backfillEmployeeScores(String adminUsername) {
        List<MiniJobCard> allJobCards = miniJobCardRepository.findAll();
        int count = 0;

        for (MiniJobCard jobCard : allJobCards) {
            // Only backfill for approved, completed jobs that don't have scores
            if (jobCard.getApproved() &&
                jobCard.getStatus() == JobStatus.COMPLETED &&
                jobCard.getEndTime() != null &&
                !employeeScoreRepository.existsByMiniJobCardId(jobCard.getId())) {

                try {
                    EmployeeScore employeeScore = new EmployeeScore();
                    employeeScore.setEmployee(jobCard.getEmployee());
                    employeeScore.setMiniJobCard(jobCard);
                    employeeScore.setWorkDate(jobCard.getEndTime().toLocalDate());
                    employeeScore.setWeight(jobCard.getMainTicket().getWeight());
                    employeeScore.setApprovedBy(adminUsername);
                    employeeScore.setApprovedAt(LocalDateTime.now(timeZoneConfig.getZoneId()));
                    employeeScoreRepository.save(employeeScore);
                    count++;
                } catch (Exception e) {
                    System.err.println("Warning: Failed to backfill score for job card " + jobCard.getId() + ": " + e.getMessage());
                }
            }
        }

        return count;
    }

    /**
     * Update job card image URL
     *
     * @param miniJobCardId The mini job card ID
     * @param imageUrl The image filename/URL
     * @return Updated MiniJobCard
     */
    @Transactional
    public MiniJobCard updateJobCardImage(Long miniJobCardId, String imageUrl) {
        MiniJobCard miniJobCard = miniJobCardRepository.findById(miniJobCardId)
                .orElseThrow(() -> new RuntimeException("Mini job card not found with ID: " + miniJobCardId));

        miniJobCard.setImageUrl(imageUrl);
        return miniJobCardRepository.save(miniJobCard);
    }
}
