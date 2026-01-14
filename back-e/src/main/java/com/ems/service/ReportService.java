package com.ems.service;

import com.ems.config.TimeZoneConfig;
import com.ems.dto.DailyTimeTrackingReportDTO;
import com.ems.dto.EmployeeDailyWorkTimeReportDTO;
import com.ems.dto.OTReportResponse;
import com.ems.dto.TimeTrackingReportResponse;
import com.ems.entity.*;
import com.ems.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {
    
    @Autowired
    private EmployeeDayAttendanceRepository attendanceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MiniJobCardRepository miniJobCardRepository;
    
    @Autowired
    private JobStatusLogRepository jobStatusLogRepository;

    @Autowired
    private EmployeeScoreRepository employeeScoreRepository;

    @Autowired
    private MainTicketRepository mainTicketRepository;

    @Autowired
    private GeneratorRepository generatorRepository;

    @Autowired
    private TimeZoneConfig timeZoneConfig;
    
    public List<TimeTrackingReportResponse> getTimeTrackingReport(Long employeeId, LocalDate startDate, LocalDate endDate) {
        User employee = null;
        if (employeeId != null) {
            employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
        }
        
        List<EmployeeDayAttendance> attendances;
        if (employee != null) {
            attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
        } else {
            // Get all employees' attendance
            attendances = new ArrayList<>();
            List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
            for (User emp : employees) {
                attendances.addAll(attendanceRepository.findByEmployeeAndDateBetween(emp, startDate, endDate));
            }
        }
        
        List<TimeTrackingReportResponse> reports = new ArrayList<>();
        
        for (EmployeeDayAttendance attendance : attendances) {
            TimeTrackingReportResponse report = new TimeTrackingReportResponse();
            report.setEmployeeName(attendance.getEmployee().getFullName());
            report.setDate(attendance.getDate());
            report.setDayStartTime(attendance.getDayStartTime());
            report.setDayEndTime(attendance.getDayEndTime());
            
            // Calculate work, idle, and travel time from job status logs
            List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployee(
                    attendance.getEmployee(), 
                    org.springframework.data.domain.Pageable.unpaged()
            ).getContent();
            
            int totalWorkMinutes = 0;
            int totalIdleMinutes = 0;
            int totalTravelMinutes = 0;
            
            for (MiniJobCard jobCard : jobCards) {
                if (jobCard.getStartTime() != null && 
                    jobCard.getStartTime().toLocalDate().equals(attendance.getDate())) {
                    
                    List<JobStatusLog> logs = jobStatusLogRepository.findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());
                    
                    // Calculate time in each status
                    for (int i = logs.size() - 1; i > 0; i--) {
                        JobStatusLog currentLog = logs.get(i);
                        JobStatusLog nextLog = logs.get(i - 1);
                        
                        long minutes = java.time.Duration.between(currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();
                        
                        if (currentLog.getNewStatus() == JobStatus.STARTED) {
                            totalWorkMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                            totalIdleMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                            totalTravelMinutes += minutes;
                        }
                    }
                }
            }
            
            report.setWorkMinutes(totalWorkMinutes);
            report.setIdleMinutes(totalIdleMinutes);
            report.setTravelMinutes(totalTravelMinutes);
            report.setTotalMinutes(attendance.getTotalWorkMinutes());
            
            reports.add(report);
        }
        
        return reports;
    }
    
    public List<OTReportResponse> getOTReport(Long employeeId, LocalDate startDate, LocalDate endDate) {
        User employee = null;
        if (employeeId != null) {
            employee = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
        }
        
        List<EmployeeDayAttendance> attendances;
        if (employee != null) {
            attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
        } else {
            attendances = new ArrayList<>();
            List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
            for (User emp : employees) {
                attendances.addAll(attendanceRepository.findByEmployeeAndDateBetween(emp, startDate, endDate));
            }
        }
        
        List<OTReportResponse> reports = new ArrayList<>();
        
        for (EmployeeDayAttendance attendance : attendances) {
            OTReportResponse report = new OTReportResponse();
            report.setEmployeeName(attendance.getEmployee().getFullName());
            report.setDate(attendance.getDate());
            report.setMorningOtMinutes(attendance.getMorningOtMinutes());
            report.setEveningOtMinutes(attendance.getEveningOtMinutes());
            report.setTotalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());
            
            reports.add(report);
        }
        
        return reports;
    }
    
    public Map<String, Object> getOTReportByGenerator(LocalDate startDate, LocalDate endDate) {
        List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE, org.springframework.data.domain.Pageable.unpaged()).getContent();
        
        Map<String, Map<String, Integer>> generatorOTMap = new HashMap<>();
        
        for (User employee : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
            
            for (EmployeeDayAttendance attendance : attendances) {
                // Get job cards for this employee on this date
                List<MiniJobCard> jobCards = miniJobCardRepository.findByEmployee(
                        employee, 
                        org.springframework.data.domain.Pageable.unpaged()
                ).getContent().stream()
                        .filter(jc -> jc.getStartTime() != null && 
                                     jc.getStartTime().toLocalDate().equals(attendance.getDate()))
                        .collect(Collectors.toList());
                
                for (MiniJobCard jobCard : jobCards) {
                    String generatorName = jobCard.getMainTicket().getGenerator().getName();
                    
                    generatorOTMap.putIfAbsent(generatorName, new HashMap<>());
                    Map<String, Integer> otData = generatorOTMap.get(generatorName);
                    
                    otData.put("morningOT", otData.getOrDefault("morningOT", 0) + attendance.getMorningOtMinutes());
                    otData.put("eveningOT", otData.getOrDefault("eveningOT", 0) + attendance.getEveningOtMinutes());
                    otData.put("totalOT", otData.getOrDefault("totalOT", 0) + 
                              attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());
                }
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("generatorWiseOT", generatorOTMap);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        
        return result;
    }
    
    public Map<String, Object> getEmployeeScoreReport(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        List<EmployeeScore> scores = employeeScoreRepository.findByEmployeeId(employeeId);

        int totalScore = 0;

        for (EmployeeScore score : scores) {
            totalScore += score.getWeight(); // Weight is the score
        }

        double averageScore = scores.size() > 0 ? (double) totalScore / scores.size() : 0.0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("employeeName", employee.getFullName());
        result.put("totalScores", scores.size());
        result.put("averageScore", averageScore);
        result.put("scores", scores);

        return result;
    }

    public Map<String, Object> getTicketCompletionReport(LocalDate startDate, LocalDate endDate) {
        List<MainTicket> allTickets = mainTicketRepository.findByScheduledDateBetween(
                startDate, endDate, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        long completed = allTickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();
        long pending = allTickets.stream().filter(t -> t.getStatus() == JobStatus.PENDING).count();
        long active = allTickets.stream().filter(t -> t.getStatus() == JobStatus.STARTED ||
                t.getStatus() == JobStatus.TRAVELING).count();
        long cancelled = allTickets.stream().filter(t -> t.getStatus() == JobStatus.CANCEL).count();

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("totalTickets", allTickets.size());
        result.put("completedTickets", completed);
        result.put("pendingTickets", pending);
        result.put("activeTickets", active);
        result.put("cancelledTickets", cancelled);
        result.put("completionRate", allTickets.size() > 0 ? (completed * 100.0 / allTickets.size()) : 0);

        return result;
    }

    public List<Map<String, Object>> getEmployeeProductivityReport(
            LocalDate startDate, LocalDate endDate, Long employeeId) {

        List<User> employees;
        if (employeeId != null) {
            User emp = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            employees = List.of(emp);
        } else {
            employees = userRepository.findByRole(UserRole.EMPLOYEE,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        List<Map<String, Object>> report = new ArrayList<>();

        for (User employee : employees) {
            List<MiniJobCard> cards = miniJobCardRepository.findByEmployee(
                            employee, org.springframework.data.domain.Pageable.unpaged())
                    .getContent()
                    .stream()
                    .filter(c -> c.getCreatedAt().toLocalDate().isAfter(startDate.minusDays(1)) &&
                            c.getCreatedAt().toLocalDate().isBefore(endDate.plusDays(1)))
                    .toList();

            long completedJobs = cards.stream().filter(c -> c.getStatus() == JobStatus.COMPLETED).count();
            int totalWorkMinutes = cards.stream().mapToInt(MiniJobCard::getWorkMinutes).sum();

            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(
                    employee, startDate, endDate);
            int totalOT = attendances.stream()
                    .mapToInt(a -> a.getMorningOtMinutes() + a.getEveningOtMinutes())
                    .sum();

            Map<String, Object> empReport = new HashMap<>();
            empReport.put("employeeId", employee.getId());
            empReport.put("employeeName", employee.getFullName());
            empReport.put("totalJobs", cards.size());
            empReport.put("completedJobs", completedJobs);
            empReport.put("totalWorkMinutes", totalWorkMinutes);
            empReport.put("totalOTMinutes", totalOT);
            empReport.put("completionRate", cards.size() > 0 ? (completedJobs * 100.0 / cards.size()) : 0);

            report.add(empReport);
        }

        return report;
    }

    public Map<String, Object> getGeneratorServiceHistory(Long generatorId) {
        Generator generator = generatorRepository.findById(generatorId)
                .orElseThrow(() -> new RuntimeException("Generator not found"));

        List<MainTicket> tickets = mainTicketRepository.findAll().stream()
                .filter(t -> t.getGenerator().getId().equals(generatorId))
                .toList();

        long completed = tickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();

        Map<String, Object> result = new HashMap<>();
        result.put("generatorId", generatorId);
        result.put("generatorName", generator.getName());
        result.put("generatorLocation", generator.getLocationName());
        result.put("totalServices", tickets.size());
        result.put("completedServices", completed);
        result.put("tickets", tickets);

        return result;
    }

    public Map<String, Object> getDailyAttendanceReport(LocalDate date) {
        List<User> allEmployees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<Map<String, Object>> attendanceData = new ArrayList<>();
        int totalWorkMinutes = 0;
        int totalOT = 0;

        for (User employee : allEmployees) {
            EmployeeDayAttendance attendance = attendanceRepository.findByEmployeeAndDate(employee, date)
                    .orElse(null);

            if (attendance != null) {
                Map<String, Object> data = new HashMap<>();
                data.put("employeeName", employee.getFullName());
                data.put("dayStartTime", attendance.getDayStartTime());
                data.put("dayEndTime", attendance.getDayEndTime());
                data.put("totalWorkMinutes", attendance.getTotalWorkMinutes());
                data.put("morningOT", attendance.getMorningOtMinutes());
                data.put("eveningOT", attendance.getEveningOtMinutes());
                data.put("totalOT", attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes());

                attendanceData.add(data);
                totalWorkMinutes += attendance.getTotalWorkMinutes();
                totalOT += attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes();
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("date", date);
        result.put("employeesWorked", attendanceData.size());
        result.put("totalEmployees", allEmployees.size());
        result.put("totalWorkMinutes", totalWorkMinutes);
        result.put("totalOTMinutes", totalOT);
        result.put("attendanceData", attendanceData);

        return result;
    }

    public Map<String, Object> getMonthlySummaryReport(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<MainTicket> tickets = mainTicketRepository.findByScheduledDateBetween(
                startDate, endDate, org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        List<User> employees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        int totalWorkMinutes = 0;
        int totalOT = 0;

        for (User emp : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository.findByEmployeeAndDateBetween(
                    emp, startDate, endDate);
            totalWorkMinutes += attendances.stream().mapToInt(EmployeeDayAttendance::getTotalWorkMinutes).sum();
            totalOT += attendances.stream()
                    .mapToInt(a -> a.getMorningOtMinutes() + a.getEveningOtMinutes())
                    .sum();
        }

        long completedTickets = tickets.stream().filter(t -> t.getStatus() == JobStatus.COMPLETED).count();

        Map<String, Object> result = new HashMap<>();
        result.put("year", year);
        result.put("month", month);
        result.put("totalTickets", tickets.size());
        result.put("completedTickets", completedTickets);
        result.put("totalEmployees", employees.size());
        result.put("totalWorkMinutes", totalWorkMinutes);
        result.put("totalOTMinutes", totalOT);
        result.put("completionRate", tickets.size() > 0 ? (completedTickets * 100.0 / tickets.size()) : 0);

        return result;
    }

    public byte[] exportTimeTrackingReportCSV(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<TimeTrackingReportResponse> data = getTimeTrackingReport(employeeId, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Employee Name,Date,Day Start,Day End,Work Minutes,Idle Minutes,Travel Minutes,Total Minutes\n");

        for (TimeTrackingReportResponse row : data) {
            csv.append(row.getEmployeeName()).append(",");
            csv.append(row.getDate()).append(",");
            csv.append(row.getDayStartTime()).append(",");
            csv.append(row.getDayEndTime()).append(",");
            csv.append(row.getWorkMinutes()).append(",");
            csv.append(row.getIdleMinutes()).append(",");
            csv.append(row.getTravelMinutes()).append(",");
            csv.append(row.getTotalMinutes()).append("\n");
        }

        return csv.toString().getBytes();
    }

    public byte[] exportOTReportCSV(Long employeeId, LocalDate startDate, LocalDate endDate) {
        List<OTReportResponse> data = getOTReport(employeeId, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        csv.append("Employee Name,Date,Morning OT (minutes),Evening OT (minutes),Total OT (minutes)\n");

        for (OTReportResponse row : data) {
            csv.append(row.getEmployeeName()).append(",");
            csv.append(row.getDate()).append(",");
            csv.append(row.getMorningOtMinutes()).append(",");
            csv.append(row.getEveningOtMinutes()).append(",");
            csv.append(row.getTotalOtMinutes()).append("\n");
        }

        return csv.toString().getBytes();
    }

    public Map<String, Object> getDashboardStatistics() {
        List<MainTicket> allTickets = mainTicketRepository.findAll();
        List<MiniJobCard> allJobCards = miniJobCardRepository.findAll();
        List<User> allEmployees = userRepository.findByRole(UserRole.EMPLOYEE,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        // Calculate employee counts
        long totalEmployees = allEmployees.size();
        long activeEmployees = allEmployees.stream()
                .filter(emp -> emp.getActive() != null && emp.getActive())
                .count();

        // Calculate generator count
        long totalGenerators = generatorRepository.findAll().size();

        // Calculate ticket counts
        long totalTickets = allTickets.size();
        long pendingTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.PENDING)
                .count();
        long completedTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.COMPLETED)
                .count();

        // Calculate pending approvals
        long pendingApprovals = allJobCards.stream()
                .filter(c -> c.getStatus() == JobStatus.COMPLETED && !c.getApproved())
                .count();

        // Calculate monthly work and OT minutes
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        long totalWorkMinutesThisMonth = 0;
        long totalOTMinutesThisMonth = 0;

        for (User employee : allEmployees) {
            List<EmployeeDayAttendance> monthlyAttendance =
                attendanceRepository.findByEmployeeAndDateBetween(employee, firstDayOfMonth, lastDayOfMonth);

            for (EmployeeDayAttendance attendance : monthlyAttendance) {
                if (attendance.getTotalWorkMinutes() != null) {
                    totalWorkMinutesThisMonth += attendance.getTotalWorkMinutes();
                }
                if (attendance.getMorningOtMinutes() != null) {
                    totalOTMinutesThisMonth += attendance.getMorningOtMinutes();
                }
                if (attendance.getEveningOtMinutes() != null) {
                    totalOTMinutesThisMonth += attendance.getEveningOtMinutes();
                }
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalEmployees", totalEmployees);
        stats.put("activeEmployees", activeEmployees);
        stats.put("totalGenerators", totalGenerators);
        stats.put("totalTickets", totalTickets);
        stats.put("pendingTickets", pendingTickets);
        stats.put("completedTickets", completedTickets);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("totalWorkMinutesThisMonth", totalWorkMinutesThisMonth);
        stats.put("totalOTMinutesThisMonth", totalOTMinutesThisMonth);

        return stats;
    }

    /**
     * Generate comprehensive employee work report for a date range
     *
     * Includes:
     * - Daily attendance (check-in/out, work hours, OT)
     * - Jobs worked on (generators/machines)
     * - Daily and total performance scores
     * - Summary statistics
     *
     * @param employeeId Employee ID
     * @param startDate Report start date
     * @param endDate Report end date
     * @return EmployeeWorkReportDTO with complete work details
     */
    public com.ems.dto.EmployeeWorkReportDTO getEmployeeWorkReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        // Fetch employee
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        // Fetch attendance records for date range
        List<EmployeeDayAttendance> attendances = attendanceRepository
                .findByEmployeeAndDateBetween(employee, startDate, endDate);

        // Fetch all mini job cards in date range
        List<MiniJobCard> allJobCards = miniJobCardRepository
                .findByEmployee(employee, org.springframework.data.domain.Pageable.unpaged())
                .getContent()
                .stream()
                .filter(jc -> jc.getEndTime() != null &&
                        !jc.getEndTime().toLocalDate().isBefore(startDate) &&
                        !jc.getEndTime().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Fetch scores for the period
        List<EmployeeScore> scores = employeeScoreRepository
                .findByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate);

        // Build daily records
        List<com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord> dailyRecords = new ArrayList<>();
        int totalDaysWorked = 0;
        int totalWorkMinutes = 0;
        int totalOtMinutes = 0;
        int totalJobsCompleted = 0;
        int totalJobsScored = 0;
        int totalJobsPending = 0;
        int totalScore = 0; // Total score (sum of all weights since weight = score)
        List<Integer> dailyScores = new ArrayList<>();

        for (EmployeeDayAttendance attendance : attendances) {
            LocalDate date = attendance.getDate();

            // Filter jobs for this specific date
            List<MiniJobCard> dayJobs = allJobCards.stream()
                    .filter(jc -> jc.getEndTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());

            // Build job details
            List<com.ems.dto.EmployeeWorkReportDTO.JobDetail> jobDetails = new ArrayList<>();
            for (MiniJobCard jobCard : dayJobs) {
                // Get score for this job card if exists
                Optional<EmployeeScore> jobScore = scores.stream()
                        .filter(s -> s.getMiniJobCard().getId().equals(jobCard.getId()))
                        .findFirst();

                com.ems.dto.EmployeeWorkReportDTO.JobDetail jobDetail =
                        com.ems.dto.EmployeeWorkReportDTO.JobDetail.builder()
                        .miniJobCardId(jobCard.getId())
                        .mainTicketId(jobCard.getMainTicket().getId())
                        .ticketNumber(jobCard.getMainTicket().getTicketNumber())
                        .ticketTitle(jobCard.getMainTicket().getTitle())
                        .jobType(jobCard.getMainTicket().getType().toString())
                        .jobStatus(jobCard.getStatus().toString())
                        .generatorId(jobCard.getMainTicket().getGenerator().getId())
                        .generatorName(jobCard.getMainTicket().getGenerator().getName())
                        .generatorModel(jobCard.getMainTicket().getGenerator().getModel())
                        .generatorLocation(jobCard.getMainTicket().getGenerator().getLocationName())
                        .startTime(jobCard.getStartTime())
                        .endTime(jobCard.getEndTime())
                        .workMinutes(jobCard.getWorkMinutes())
                        .weight(jobCard.getMainTicket().getWeight())
                        .score(jobScore.map(EmployeeScore::getWeight).orElse(null)) // Weight is the score
                        .weightedScore(jobScore.map(EmployeeScore::getWeight).orElse(null)) // Same as score now
                        .scored(jobScore.isPresent())
                        .approved(jobCard.getApproved())
                        .build();

                jobDetails.add(jobDetail);

                // Update counters
                if (jobCard.getStatus() == JobStatus.COMPLETED) {
                    totalJobsCompleted++;
                    if (jobScore.isPresent()) {
                        totalJobsScored++;
                    } else if (jobCard.getApproved()) {
                        totalJobsPending++;
                    }
                }
            }

            // Calculate daily score (weight is the score)
            int dailyScore = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .mapToInt(EmployeeScore::getWeight) // Weight is the score
                    .sum();

            long dailyJobCount = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .count();

            double dailyAverageScore = dailyJobCount > 0
                    ? (double) dailyScore / dailyJobCount
                    : 0.0;

            if (dailyScore > 0) {
                dailyScores.add(dailyScore);
            }

            // Build daily record
            com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord dailyRecord =
                    com.ems.dto.EmployeeWorkReportDTO.DailyWorkRecord.builder()
                    .date(date)
                    .checkInTime(attendance.getDayStartTime())
                    .checkOutTime(attendance.getDayEndTime())
                    .totalWorkMinutes(attendance.getTotalWorkMinutes())
                    .morningOtMinutes(attendance.getMorningOtMinutes())
                    .eveningOtMinutes(attendance.getEveningOtMinutes())
                    .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                    .jobs(jobDetails)
                    .dailyScore(dailyScore > 0 ? dailyScore : null)
                    .dailyTotalWeight(dailyScore > 0 ? dailyScore : null) // Same as dailyScore now (weight = score)
                    .dailyAverageScore(dailyAverageScore > 0 ? dailyAverageScore : null)
                    .build();

            dailyRecords.add(dailyRecord);

            // Update summary counters
            totalDaysWorked++;
            totalWorkMinutes += attendance.getTotalWorkMinutes();
            totalOtMinutes += attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes();
            totalScore += dailyScore; // dailyScore is sum of weights for the day
        }

        // Calculate summary statistics
        double overallAverageScore = totalJobsScored > 0
                ? (double) totalScore / totalJobsScored
                : 0.0;

        Integer maxDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().max(Integer::compareTo).orElse(null);
        Integer minDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().min(Integer::compareTo).orElse(null);
        Double averageDailyScore = dailyScores.isEmpty() ? null : dailyScores.stream().mapToInt(Integer::intValue).average().orElse(0.0);

        com.ems.dto.EmployeeWorkReportDTO.SummaryStatistics summary =
                com.ems.dto.EmployeeWorkReportDTO.SummaryStatistics.builder()
                .totalDaysWorked(totalDaysWorked)
                .totalWorkMinutes(totalWorkMinutes)
                .totalOtMinutes(totalOtMinutes)
                .totalJobsCompleted(totalJobsCompleted)
                .totalJobsScored(totalJobsScored)
                .totalJobsPending(totalJobsPending)
                .totalWeightedScore(totalScore) // Total score (weight = score)
                .totalWeight(totalScore) // Same as totalWeightedScore now
                .overallAverageScore(overallAverageScore)
                .maxDailyScore(maxDailyScore)
                .minDailyScore(minDailyScore)
                .averageDailyScore(averageDailyScore)
                .build();

        // Build final report
        return com.ems.dto.EmployeeWorkReportDTO.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .employeeEmail(employee.getEmail())
                .reportStartDate(startDate)
                .reportEndDate(endDate)
                .dailyRecords(dailyRecords)
                .summary(summary)
                .build();
    }

    /**
     * Generate Daily Time Tracking Report with location information
     *
     * @param employeeId Optional employee ID (null for all employees)
     * @param startDate Report start date
     * @param endDate Report end date
     * @return List of DailyTimeTrackingReportDTO
     */
    public List<DailyTimeTrackingReportDTO> getDailyTimeTrackingReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        List<User> employees;
        if (employeeId != null) {
            User emp = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            employees = List.of(emp);
        } else {
            employees = userRepository.findByRole(UserRole.EMPLOYEE,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        List<DailyTimeTrackingReportDTO> reports = new ArrayList<>();

        for (User employee : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository
                    .findByEmployeeAndDateBetween(employee, startDate, endDate);

            for (EmployeeDayAttendance attendance : attendances) {
                LocalDate date = attendance.getDate();

                // Get all job cards for this employee on this date
                List<MiniJobCard> jobCards = miniJobCardRepository
                        .findByEmployee(employee, org.springframework.data.domain.Pageable.unpaged())
                        .getContent()
                        .stream()
                        .filter(jc -> jc.getStartTime() != null &&
                                jc.getStartTime().toLocalDate().equals(date))
                        .collect(Collectors.toList());

                // Calculate work, idle, and travel time from job status logs
                int totalWorkMinutes = 0;
                int totalIdleMinutes = 0;
                int totalTravelMinutes = 0;
                String location = "";
                List<DailyTimeTrackingReportDTO.LocationPoint> locationPath = new ArrayList<>();

                for (MiniJobCard jobCard : jobCards) {
                    List<JobStatusLog> logs = jobStatusLogRepository
                            .findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());

                    // Get location from the latest log with location data
                    if (location.isEmpty() && !logs.isEmpty()) {
                        for (JobStatusLog log : logs) {
                            if (log.getLatitude() != null && log.getLongitude() != null) {
                                // Use generator location as primary location
                                location = jobCard.getMainTicket().getGenerator().getLocationName();
                                break;
                            }
                        }
                    }

                    // Collect all location points from logs (in chronological order)
                    List<JobStatusLog> reversedLogs = new ArrayList<>(logs);
                    Collections.reverse(reversedLogs);
                    for (JobStatusLog log : reversedLogs) {
                        if (log.getLatitude() != null && log.getLongitude() != null) {
                            locationPath.add(DailyTimeTrackingReportDTO.LocationPoint.builder()
                                    .latitude(log.getLatitude())
                                    .longitude(log.getLongitude())
                                    .timestamp(log.getLoggedAt())
                                    .build());
                        }
                    }

                    // Calculate time in each status
                    for (int i = logs.size() - 1; i > 0; i--) {
                        JobStatusLog currentLog = logs.get(i);
                        JobStatusLog nextLog = logs.get(i - 1);

                        long minutes = java.time.Duration.between(
                                currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();

                        if (currentLog.getNewStatus() == JobStatus.STARTED) {
                            totalWorkMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                            totalIdleMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                            totalTravelMinutes += minutes;
                        }
                    }
                }

                DailyTimeTrackingReportDTO report = DailyTimeTrackingReportDTO.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getFullName())
                        .date(date)
                        .startTime(attendance.getDayStartTime())
                        .endTime(attendance.getDayEndTime())
                        .location(location.isEmpty() ? "N/A" : location)
                        .dailyWorkingMinutes(totalWorkMinutes)
                        .idleMinutes(totalIdleMinutes)
                        .travelMinutes(totalTravelMinutes)
                        .totalMinutes(attendance.getTotalWorkMinutes())
                        .locationPath(locationPath)
                        .build();

                reports.add(report);
            }
        }

        return reports;
    }

    /**
     * Generate Employee Daily Work Time Report with weight earned
     *
     * @param employeeId Employee ID (required)
     * @param startDate Report start date
     * @param endDate Report end date
     * @return List of EmployeeDailyWorkTimeReportDTO
     */
    public List<EmployeeDailyWorkTimeReportDTO> getEmployeeDailyWorkTimeReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<EmployeeDayAttendance> attendances = attendanceRepository
                .findByEmployeeAndDateBetween(employee, startDate, endDate);

        // Fetch scores for the period
        List<EmployeeScore> scores = employeeScoreRepository
                .findByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate);

        List<EmployeeDailyWorkTimeReportDTO> reports = new ArrayList<>();

        for (EmployeeDayAttendance attendance : attendances) {
            LocalDate date = attendance.getDate();

            // Calculate total weight earned on this day
            int totalWeightEarned = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .mapToInt(EmployeeScore::getWeight)
                    .sum();

            // Count jobs completed on this day
            long jobsCompleted = scores.stream()
                    .filter(s -> s.getWorkDate().equals(date))
                    .count();

            EmployeeDailyWorkTimeReportDTO report = EmployeeDailyWorkTimeReportDTO.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getFullName())
                    .date(date)
                    .startTime(attendance.getDayStartTime())
                    .endTime(attendance.getDayEndTime())
                    .morningOtMinutes(attendance.getMorningOtMinutes())
                    .eveningOtMinutes(attendance.getEveningOtMinutes())
                    .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                    .workingMinutes(attendance.getTotalWorkMinutes())
                    .totalWeightEarned(totalWeightEarned)
                    .jobsCompleted((int) jobsCompleted)
                    .build();

            reports.add(report);
        }

        return reports;
    }

    /**
     * Get Daily Time Tracking and Performance Report (Merged Report)
     * Combines time tracking metrics with OT and performance data
     */
    public List<DailyTimeTrackingAndPerformanceReportDTO> getDailyTimeTrackingAndPerformanceReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        List<User> employees;
        if (employeeId != null) {
            User emp = userRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));
            employees = List.of(emp);
        } else {
            employees = userRepository.findByRole(UserRole.EMPLOYEE,
                    org.springframework.data.domain.Pageable.unpaged()).getContent();
        }

        List<DailyTimeTrackingAndPerformanceReportDTO> reports = new ArrayList<>();

        for (User employee : employees) {
            List<EmployeeDayAttendance> attendances = attendanceRepository
                    .findByEmployeeAndDateBetween(employee, startDate, endDate);

            for (EmployeeDayAttendance attendance : attendances) {
                LocalDate date = attendance.getDate();

                // Get all job cards for this employee on this date
                List<MiniJobCard> jobCards = miniJobCardRepository
                        .findByEmployee(employee, org.springframework.data.domain.Pageable.unpaged())
                        .getContent()
                        .stream()
                        .filter(jc -> jc.getStartTime() != null &&
                                jc.getStartTime().toLocalDate().equals(date))
                        .collect(Collectors.toList());

                // Calculate time metrics from job status logs
                int totalWorkMinutes = 0;
                int totalIdleMinutes = 0;
                int totalTravelMinutes = 0;
                String location = "";
                List<DailyTimeTrackingAndPerformanceReportDTO.LocationPoint> locationPath = new ArrayList<>();

                // Performance metrics
                long jobsCompleted = jobCards.stream()
                        .filter(jc -> jc.getStatus() == JobStatus.COMPLETED)
                        .count();

                int totalWeightEarned = jobCards.stream()
                        .filter(jc -> jc.getStatus() == JobStatus.COMPLETED)
                        .mapToInt(jc -> {
                            List<EmployeeScore> scores = employeeScoreRepository
                                    .findByMiniJobCard(jc);
                            return scores.stream().mapToInt(EmployeeScore::getScore).sum();
                        })
                        .sum();

                double averageScore = jobsCompleted > 0 ? (double) totalWeightEarned / jobsCompleted : 0.0;

                for (MiniJobCard jobCard : jobCards) {
                    List<JobStatusLog> logs = jobStatusLogRepository
                            .findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());

                    // Get location from logs
                    if (location.isEmpty() && !logs.isEmpty()) {
                        for (JobStatusLog log : logs) {
                            if (log.getLatitude() != null && log.getLongitude() != null) {
                                location = jobCard.getMainTicket().getGenerator().getLocationName();
                                break;
                            }
                        }
                    }

                    // Collect location points
                    List<JobStatusLog> reversedLogs = new ArrayList<>(logs);
                    Collections.reverse(reversedLogs);
                    for (JobStatusLog log : reversedLogs) {
                        if (log.getLatitude() != null && log.getLongitude() != null) {
                            locationPath.add(DailyTimeTrackingAndPerformanceReportDTO.LocationPoint.builder()
                                    .latitude(log.getLatitude())
                                    .longitude(log.getLongitude())
                                    .timestamp(log.getLoggedAt())
                                    .build());
                        }
                    }

                    // Calculate time in each status
                    for (int i = logs.size() - 1; i > 0; i--) {
                        JobStatusLog currentLog = logs.get(i);
                        JobStatusLog nextLog = logs.get(i - 1);

                        long minutes = java.time.Duration.between(
                                currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();

                        if (currentLog.getNewStatus() == JobStatus.STARTED) {
                            totalWorkMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                            totalIdleMinutes += minutes;
                        } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                            totalTravelMinutes += minutes;
                            totalWorkMinutes += minutes; // Travel also counts as work time
                        }
                    }
                }

                DailyTimeTrackingAndPerformanceReportDTO report = DailyTimeTrackingAndPerformanceReportDTO.builder()
                        .employeeId(employee.getId())
                        .employeeName(employee.getFullName())
                        .date(date)
                        .startTime(attendance.getDayStartTime())
                        .endTime(attendance.getDayEndTime())
                        .location(location.isEmpty() ? "N/A" : location)
                        .dailyWorkingMinutes(totalWorkMinutes)
                        .idleMinutes(totalIdleMinutes)
                        .travelMinutes(totalTravelMinutes)
                        .totalMinutes(attendance.getTotalWorkMinutes())
                        .morningOtMinutes(attendance.getMorningOtMinutes())
                        .eveningOtMinutes(attendance.getEveningOtMinutes())
                        .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                        .jobsCompleted((int) jobsCompleted)
                        .totalWeightEarned(totalWeightEarned)
                        .averageScore(averageScore)
                        .locationPath(locationPath)
                        .build();

                reports.add(report);
            }
        }

        return reports;
    }

    /**
     * Get Employee Achievement Report
     * Shows ticket-level daily progress and achievements
     */
    public List<EmployeeAchievementReportDTO> getEmployeeAchievementReport(
            Long employeeId, LocalDate startDate, LocalDate endDate) {

        if (employeeId == null) {
            throw new RuntimeException("Employee ID is required for achievement report");
        }

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<EmployeeDayAttendance> attendances = attendanceRepository
                .findByEmployeeAndDateBetween(employee, startDate, endDate);

        List<EmployeeAchievementReportDTO> reports = new ArrayList<>();

        for (EmployeeDayAttendance attendance : attendances) {
            LocalDate date = attendance.getDate();

            // Get all job cards for this date
            List<MiniJobCard> jobCards = miniJobCardRepository
                    .findByEmployee(employee, org.springframework.data.domain.Pageable.unpaged())
                    .getContent()
                    .stream()
                    .filter(jc -> jc.getStartTime() != null &&
                            jc.getStartTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());

            if (jobCards.isEmpty()) {
                continue; // Skip days with no tickets
            }

            // Build ticket achievements
            List<EmployeeAchievementReportDTO.TicketAchievement> ticketAchievements = new ArrayList<>();

            int dailyTotalWorkMinutes = 0;
            int dailyTotalTravelMinutes = 0;
            int dailyTotalIdleMinutes = 0;
            int dailyTotalWeight = 0;
            int completedCount = 0;
            int pendingCount = 0;

            for (MiniJobCard jobCard : jobCards) {
                // Get status logs for this job
                List<JobStatusLog> logs = jobStatusLogRepository
                        .findByMiniJobCardIdOrderByLoggedAtDesc(jobCard.getId());

                // Calculate time in each status
                int workMinutes = 0;
                int travelMinutes = 0;
                int idleMinutes = 0;
                List<EmployeeAchievementReportDTO.StatusDuration> statusBreakdown = new ArrayList<>();

                List<JobStatusLog> reversedLogs = new ArrayList<>(logs);
                Collections.reverse(reversedLogs);

                for (int i = 0; i < reversedLogs.size() - 1; i++) {
                    JobStatusLog currentLog = reversedLogs.get(i);
                    JobStatusLog nextLog = reversedLogs.get(i + 1);

                    long minutes = java.time.Duration.between(
                            currentLog.getLoggedAt(), nextLog.getLoggedAt()).toMinutes();

                    String status = currentLog.getNewStatus().name();

                    statusBreakdown.add(EmployeeAchievementReportDTO.StatusDuration.builder()
                            .status(status)
                            .minutes((int) minutes)
                            .startTime(currentLog.getLoggedAt())
                            .endTime(nextLog.getLoggedAt())
                            .build());

                    if (currentLog.getNewStatus() == JobStatus.STARTED) {
                        workMinutes += minutes;
                    } else if (currentLog.getNewStatus() == JobStatus.TRAVELING) {
                        travelMinutes += minutes;
                        workMinutes += minutes; // Travel counts as work time
                    } else if (currentLog.getNewStatus() == JobStatus.ON_HOLD) {
                        idleMinutes += minutes;
                    }
                }

                // Get score/weight for this job
                List<EmployeeScore> scores = employeeScoreRepository.findByMiniJobCard(jobCard);
                int weight = scores.stream().mapToInt(EmployeeScore::getScore).sum();
                boolean scored = !scores.isEmpty();

                // Update daily totals
                dailyTotalWorkMinutes += workMinutes;
                dailyTotalTravelMinutes += travelMinutes;
                dailyTotalIdleMinutes += idleMinutes;
                dailyTotalWeight += weight;

                if (jobCard.getStatus() == JobStatus.COMPLETED) {
                    completedCount++;
                } else {
                    pendingCount++;
                }

                // Build ticket achievement
                EmployeeAchievementReportDTO.TicketAchievement ticketAchievement =
                        EmployeeAchievementReportDTO.TicketAchievement.builder()
                                .miniJobCardId(jobCard.getId())
                                .mainTicketId(jobCard.getMainTicket().getId())
                                .ticketNumber(jobCard.getMainTicket().getTicketNumber())
                                .ticketTitle(jobCard.getMainTicket().getTitle())
                                .jobType(jobCard.getJobType().name())
                                .generatorName(jobCard.getMainTicket().getGenerator().getName())
                                .generatorModel(jobCard.getMainTicket().getGenerator().getModel())
                                .generatorLocation(jobCard.getMainTicket().getGenerator().getLocationName())
                                .startTime(jobCard.getStartTime())
                                .endTime(jobCard.getEndTime())
                                .workMinutes(workMinutes)
                                .travelMinutes(travelMinutes)
                                .idleMinutes(idleMinutes)
                                .currentStatus(jobCard.getStatus().name())
                                .weight(weight)
                                .scored(scored)
                                .approved(jobCard.getApproved())
                                .statusBreakdown(statusBreakdown)
                                .build();

                ticketAchievements.add(ticketAchievement);
            }

            // Build daily summary
            EmployeeAchievementReportDTO.DailySummary dailySummary =
                    EmployeeAchievementReportDTO.DailySummary.builder()
                            .totalTickets(jobCards.size())
                            .completedTickets(completedCount)
                            .pendingTickets(pendingCount)
                            .totalWorkMinutes(dailyTotalWorkMinutes)
                            .totalTravelMinutes(dailyTotalTravelMinutes)
                            .totalIdleMinutes(dailyTotalIdleMinutes)
                            .totalWeightEarned(dailyTotalWeight)
                            .morningOtMinutes(attendance.getMorningOtMinutes())
                            .eveningOtMinutes(attendance.getEveningOtMinutes())
                            .totalOtMinutes(attendance.getMorningOtMinutes() + attendance.getEveningOtMinutes())
                            .build();

            // Build daily report
            EmployeeAchievementReportDTO report = EmployeeAchievementReportDTO.builder()
                    .employeeId(employee.getId())
                    .employeeName(employee.getFullName())
                    .date(date)
                    .dayStartTime(attendance.getDayStartTime())
                    .dayEndTime(attendance.getDayEndTime())
                    .dailySummary(dailySummary)
                    .ticketAchievements(ticketAchievements)
                    .build();

            reports.add(report);
        }

        return reports;
    }
}
