package com.ems.service;

import com.ems.config.TimeZoneConfig;
import com.ems.dto.ActivityLogResponseDTO;
import com.ems.entity.*;
import com.ems.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class LogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private TimeZoneConfig timeZoneConfig;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    /**
     * Create a new activity log entry
     */
    public ActivityLog createLog(ActivityLog log) {
        return activityLogRepository.save(log);
    }

    /**
     * Log a status update activity
     */
    public void logStatusUpdate(User employee, MiniJobCard miniJobCard, JobStatus oldStatus, JobStatus newStatus, Double latitude, Double longitude) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(employee)
                .activityType(ActivityType.STATUS_UPDATE)
                .miniJobCard(miniJobCard)
                .mainTicket(miniJobCard.getMainTicket())
                .generator(miniJobCard.getMainTicket().getGenerator())
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .latitude(latitude)
                .longitude(longitude)
                .details("Status changed from " + oldStatus + " to " + newStatus)
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Log day start activity
     */
    public void logDayStart(User employee, Double latitude, Double longitude) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(employee)
                .activityType(ActivityType.DAY_START)
                .latitude(latitude)
                .longitude(longitude)
                .details("Employee started their day")
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Log day end activity
     */
    public void logDayEnd(User employee, Double latitude, Double longitude) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(employee)
                .activityType(ActivityType.DAY_END)
                .latitude(latitude)
                .longitude(longitude)
                .details("Employee ended their day")
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Log job approval activity
     */
    public void logJobApproval(User approver, User employee, MiniJobCard miniJobCard) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(approver)
                .activityType(ActivityType.JOB_APPROVED)
                .miniJobCard(miniJobCard)
                .mainTicket(miniJobCard.getMainTicket())
                .generator(miniJobCard.getMainTicket().getGenerator())
                .details("Job approved by " + approver.getFullName())
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Log job rejection activity
     */
    public void logJobRejection(User rejector, User employee, MiniJobCard miniJobCard) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(rejector)
                .activityType(ActivityType.JOB_REJECTED)
                .miniJobCard(miniJobCard)
                .mainTicket(miniJobCard.getMainTicket())
                .generator(miniJobCard.getMainTicket().getGenerator())
                .details("Job rejected by " + rejector.getFullName())
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Log job assignment activity
     */
    public void logJobAssignment(User assignedBy, User employee, MiniJobCard miniJobCard) {
        ActivityLog log = ActivityLog.builder()
                .employee(employee)
                .performer(assignedBy)
                .activityType(ActivityType.JOB_ASSIGNED)
                .miniJobCard(miniJobCard)
                .mainTicket(miniJobCard.getMainTicket())
                .generator(miniJobCard.getMainTicket().getGenerator())
                .details("Job assigned to " + employee.getFullName() + " by " + assignedBy.getFullName())
                .timestamp(LocalDateTime.now(timeZoneConfig.getZoneId()))
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Get all logs with pagination
     */
    public Page<ActivityLogResponseDTO> getAllLogs(Pageable pageable) {
        Page<ActivityLog> logs = activityLogRepository.findAllByOrderByTimestampDesc(pageable);
        return logs.map(this::convertToDTO);
    }

    /**
     * Get logs filtered by employee and/or date range
     */
    public Page<ActivityLogResponseDTO> getFilteredLogs(Long employeeId, String startDateStr, String endDateStr, Pageable pageable) {
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        // Parse date strings if provided
        if (startDateStr != null && !startDateStr.isEmpty()) {
            startDate = LocalDate.parse(startDateStr, DATE_FORMATTER).atStartOfDay();
        }
        if (endDateStr != null && !endDateStr.isEmpty()) {
            endDate = LocalDate.parse(endDateStr, DATE_FORMATTER).atTime(LocalTime.MAX);
        }

        Page<ActivityLog> logs;

        // Apply filters based on what's provided
        if (employeeId != null && startDate != null && endDate != null) {
            logs = activityLogRepository.findByEmployeeIdAndDateRange(employeeId, startDate, endDate, pageable);
        } else if (employeeId != null) {
            logs = activityLogRepository.findByEmployeeIdOrderByTimestampDesc(employeeId, pageable);
        } else if (startDate != null && endDate != null) {
            logs = activityLogRepository.findByDateRange(startDate, endDate, pageable);
        } else {
            logs = activityLogRepository.findAllByOrderByTimestampDesc(pageable);
        }

        return logs.map(this::convertToDTO);
    }

    /**
     * Convert ActivityLog entity to DTO
     */
    private ActivityLogResponseDTO convertToDTO(ActivityLog log) {
        ActivityLogResponseDTO dto = ActivityLogResponseDTO.builder()
                .id(log.getId())
                .activityType(log.getActivityType())
                .activityDescription(getActivityDescription(log))
                .oldStatus(log.getOldStatus())
                .newStatus(log.getNewStatus())
                .latitude(log.getLatitude())
                .longitude(log.getLongitude())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .formattedDate(log.getTimestamp().format(DATE_FORMATTER))
                .formattedTime(log.getTimestamp().format(TIME_FORMATTER))
                .build();

        // Set employee information
        if (log.getEmployee() != null) {
            dto.setEmployeeId(log.getEmployee().getId());
            dto.setEmployeeFullName(log.getEmployee().getFullName());
            dto.setEmployeeEmail(log.getEmployee().getEmail());
        }

        // Set performer information
        if (log.getPerformer() != null) {
            dto.setPerformerId(log.getPerformer().getId());
            dto.setPerformerFullName(log.getPerformer().getFullName());
            dto.setPerformerEmail(log.getPerformer().getEmail());
        }

        // Set mini job card information
        if (log.getMiniJobCard() != null) {
            dto.setMiniJobCardId(log.getMiniJobCard().getId());
        }

        // Set main ticket information
        if (log.getMainTicket() != null) {
            dto.setMainTicketId(log.getMainTicket().getId());
            dto.setTicketNumber(log.getMainTicket().getTicketNumber());
        }

        // Set generator information
        if (log.getGenerator() != null) {
            dto.setGeneratorId(log.getGenerator().getId());
            dto.setGeneratorName(log.getGenerator().getName());
            dto.setGeneratorLocationName(log.getGenerator().getLocationName());
        }

        // Generate Google Maps URL if location is available
        if (log.getLatitude() != null && log.getLongitude() != null) {
            dto.setLocationMapUrl(String.format("https://www.google.com/maps?q=%f,%f", log.getLatitude(), log.getLongitude()));
        }

        return dto;
    }

    /**
     * Get a human-readable description of the activity
     */
    private String getActivityDescription(ActivityLog log) {
        switch (log.getActivityType()) {
            case DAY_START:
                return "Started Day";
            case DAY_END:
                return "Ended Day";
            case STATUS_UPDATE:
                return "Status Update: " + log.getOldStatus() + " → " + log.getNewStatus();
            case JOB_APPROVED:
                return "Job Approved";
            case JOB_REJECTED:
                return "Job Rejected";
            case JOB_ASSIGNED:
                return "Job Assigned";
            case JOB_CREATED:
                return "Job Created";
            case USER_CREATED:
                return "User Created";
            case USER_UPDATED:
                return "User Updated";
            case USER_ACTIVATED:
                return "User Activated";
            case USER_DEACTIVATED:
                return "User Deactivated";
            case TICKET_CREATED:
                return "Ticket Created";
            case TICKET_UPDATED:
                return "Ticket Updated";
            default:
                return "Other Activity";
        }
    }
}
