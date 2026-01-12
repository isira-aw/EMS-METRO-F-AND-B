package com.ems.service;

import com.ems.config.TimeZoneConfig;
import com.ems.entity.EmployeeDayAttendance;
import com.ems.entity.JobStatus;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import com.ems.repository.EmployeeDayAttendanceRepository;
import com.ems.repository.MiniJobCardRepository;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private EmployeeDayAttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MiniJobCardRepository miniJobCardRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private TimeZoneConfig timeZoneConfig;

    private static final LocalTime MORNING_OT_CUTOFF = LocalTime.of(8, 30);
    private static final LocalTime EVENING_OT_CUTOFF = LocalTime.of(17, 30);
    
    public EmployeeDayAttendance startDay(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDateTime now = LocalDateTime.now(timeZoneConfig.getZoneId());
        
        String uniqueKey = employee.getId() + "-" + today;
        
        // Check if already started
        if (attendanceRepository.findByUniqueKey(uniqueKey).isPresent()) {
            throw new RuntimeException("Day already started");
        }
        
        EmployeeDayAttendance attendance = new EmployeeDayAttendance();
        attendance.setEmployee(employee);
        attendance.setDate(today);
        attendance.setDayStartTime(now);
        attendance.setUniqueKey(uniqueKey);
        
        // Calculate morning OT
        if (now.toLocalTime().isBefore(MORNING_OT_CUTOFF)) {
            long morningOtMinutes = Duration.between(now.toLocalTime(), MORNING_OT_CUTOFF).toMinutes();
            attendance.setMorningOtMinutes((int) morningOtMinutes);
        }

        EmployeeDayAttendance saved = attendanceRepository.save(attendance);

        // Log day start activity
        logService.logDayStart(employee, null, null);

        return saved;
    }
    
    public EmployeeDayAttendance endDay(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        LocalDateTime now = LocalDateTime.now(timeZoneConfig.getZoneId());

        EmployeeDayAttendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElseThrow(() -> new RuntimeException("Day not started yet"));

        if (attendance.getDayEndTime() != null) {
            throw new RuntimeException("Day already ended");
        }

        // Day Closure Restriction: Check for open tickets scheduled for today
        List<MiniJobCard> allEmployeeCards = miniJobCardRepository.findByEmployee(employee, Pageable.unpaged()).getContent();
        List<MiniJobCard> openTicketsForToday = allEmployeeCards.stream()
                .filter(card -> card.getMainTicket().getScheduledDate().equals(today))
                .filter(card -> card.getStatus() != JobStatus.COMPLETED && card.getStatus() != JobStatus.CANCEL)
                .collect(Collectors.toList());

        if (!openTicketsForToday.isEmpty()) {
            String ticketNumbers = openTicketsForToday.stream()
                    .map(card -> card.getMainTicket().getTicketNumber())
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new RuntimeException("Cannot end workday. You have " + openTicketsForToday.size() +
                    " open ticket(s) scheduled for today: " + ticketNumbers +
                    ". Please complete or cancel all tickets before ending your workday.");
        }

        attendance.setDayEndTime(now);

        // Calculate evening OT
        if (now.toLocalTime().isAfter(EVENING_OT_CUTOFF)) {
            long eveningOtMinutes = Duration.between(EVENING_OT_CUTOFF, now.toLocalTime()).toMinutes();
            attendance.setEveningOtMinutes((int) eveningOtMinutes);
        }

        // Calculate regular working hours (8:30 AM - 5:30 PM only, excluding OT)
        // Only count time between official working hours
        LocalTime actualStartTime = attendance.getDayStartTime().toLocalTime();
        LocalTime actualEndTime = now.toLocalTime();

        // Work start is the later of actual start and 8:30 AM
        LocalTime workStart = actualStartTime.isAfter(MORNING_OT_CUTOFF) ? actualStartTime : MORNING_OT_CUTOFF;

        // Work end is the earlier of actual end and 5:30 PM
        LocalTime workEnd = actualEndTime.isBefore(EVENING_OT_CUTOFF) ? actualEndTime : EVENING_OT_CUTOFF;

        // Calculate total regular working minutes (only if work period is valid)
        if (workEnd.isAfter(workStart)) {
            long regularWorkMinutes = Duration.between(workStart, workEnd).toMinutes();
            attendance.setTotalWorkMinutes((int) regularWorkMinutes);
        } else {
            attendance.setTotalWorkMinutes(0);
        }

        EmployeeDayAttendance saved = attendanceRepository.save(attendance);

        // Log day end activity
        logService.logDayEnd(employee, null, null);

        return saved;
    }
    
    public boolean hasDayStarted(User employee) {
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        return attendanceRepository.findByEmployeeAndDate(employee, today).isPresent();
    }
    
    public boolean hasDayEnded(User employee) {
        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        return attendanceRepository.findByEmployeeAndDate(employee, today)
                .map(attendance -> attendance.getDayEndTime() != null)
                .orElse(false);
    }
    
    public EmployeeDayAttendance getTodayAttendance(String username) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        LocalDate today = LocalDate.now(timeZoneConfig.getZoneId());
        return attendanceRepository.findByEmployeeAndDate(employee, today)
                .orElse(null);
    }

    public Page<EmployeeDayAttendance> getAttendanceHistory(String username, Pageable pageable) {
        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Get all attendance records and paginate manually
        // In a real implementation, you would create a repository method with Pageable
        List<EmployeeDayAttendance> allAttendance = attendanceRepository.findByEmployeeAndDateBetween(
            employee,
            LocalDate.of(2000, 1, 1),
            LocalDate.now(timeZoneConfig.getZoneId())
        );

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allAttendance.size());

        List<EmployeeDayAttendance> pageContent = start >= allAttendance.size()
            ? List.of()
            : allAttendance.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allAttendance.size());
    }

    public List<EmployeeDayAttendance> getAttendanceByDateRange(
            String username,
            LocalDate startDate,
            LocalDate endDate) {

        User employee = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        return attendanceRepository.findByEmployeeAndDateBetween(employee, startDate, endDate);
    }
}
