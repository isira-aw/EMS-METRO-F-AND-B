# Time Calculation System Documentation

## Overview
This document explains how the EMS Metro F&B system calculates time for tickets, attendance, overtime (OT), and reports.

---

## 1. Ticket Time Calculation

### How It Works
Each ticket (Mini Job Card) tracks the **actual working time** by monitoring job status transitions.

### Logic Flow

```
Job Status Transitions:
PENDING → TRAVELING → STARTED → ON_HOLD → STARTED → COMPLETED
                      [______Work Time_____]         [__Work Time__]
```

### Calculation Rules
- **Only STARTED status counts as work time**
- Time is calculated from status change logs (`JobStatusLog`)
- Work time = Sum of all duration periods where status = STARTED

### Example
```
09:00 AM - Status: STARTED
10:30 AM - Status: ON_HOLD (break)
11:00 AM - Status: STARTED (resumed)
12:00 PM - Status: COMPLETED

Total Work Time = (10:30 - 09:00) + (12:00 - 11:00)
                = 90 minutes + 60 minutes
                = 150 minutes (2h 30m)
```

### Implementation
**File**: `back-e/src/main/java/com/ems/service/TicketService.java:201-220`

```java
private void calculateWorkMinutes(MiniJobCard miniJobCard) {
    // Iterate through status logs in chronological order
    // When STARTED → track start time
    // When ON_HOLD or COMPLETED → calculate duration since STARTED
    // Sum all durations to get total work minutes
}
```

---

## 2. Overtime (OT) Time Periods

### Official Working Hours
- **Start**: 8:30 AM
- **End**: 5:30 PM
- **Duration**: 9 hours (540 minutes)

### OT Categories

#### Morning OT (Before 8:30 AM)
Any time worked **before 8:30 AM** counts as morning overtime.

**Example:**
```
Check-in: 7:00 AM
Morning OT = 8:30 AM - 7:00 AM = 90 minutes (1h 30m)
```

#### Evening OT (After 5:30 PM)
Any time worked **after 5:30 PM** counts as evening overtime.

**Example:**
```
Check-out: 7:00 PM
Evening OT = 7:00 PM - 5:30 PM = 90 minutes (1h 30m)
```

#### Regular Working Hours (8:30 AM - 5:30 PM)
Only the time within official hours counts as regular work time.

**Example:**
```
Check-in: 7:00 AM
Check-out: 6:00 PM

Morning OT = 7:00 AM to 8:30 AM = 90 minutes
Regular Work = 8:30 AM to 5:30 PM = 540 minutes
Evening OT = 5:30 PM to 6:00 PM = 30 minutes

Total Time = 90 + 540 + 30 = 660 minutes (11 hours)
```

### Implementation
**File**: `back-e/src/main/java/com/ems/service/AttendanceService.java`

```java
// Constants
MORNING_OT_CUTOFF = 8:30 AM
EVENING_OT_CUTOFF = 5:30 PM

// Morning OT: if start time < 8:30 AM
morningOtMinutes = 8:30 AM - actualStartTime

// Evening OT: if end time > 5:30 PM
eveningOtMinutes = actualEndTime - 5:30 PM

// Regular Work: time between 8:30 AM and 5:30 PM only
workStartTime = max(actualStartTime, 8:30 AM)
workEndTime = min(actualEndTime, 5:30 PM)
regularWorkMinutes = workEndTime - workStartTime
```

---

## 3. Reporting Section with Date Ranges

### Available Reports

#### A. Daily Time Tracking Report
Shows daily breakdown of work activities.

**Includes:**
- Date
- Employee name
- Total work minutes
- Idle minutes (ON_HOLD status)
- Travel minutes (TRAVELING status)

**Date Range:** User selects start date and end date (default: last 7 days)

#### B. Performance & OT Report
Shows overtime and performance metrics.

**Includes:**
- Employee name
- Morning OT minutes
- Evening OT minutes
- Total OT minutes
- Work hours (regular time)
- Weight points earned

**Date Range:** Custom start and end date selection

#### C. Employee Work Report (Most Comprehensive)
Detailed report with daily records and job completion.

**Includes:**
- Daily attendance records:
  - Check-in time
  - Check-out time
  - Morning OT
  - Evening OT
  - Total work minutes
- Jobs completed each day with scores
- Daily average scores
- Summary statistics:
  - Total days worked
  - Total OT hours
  - Total weight earned
  - Overall average score

**Date Range:** Filtered by start date and end date

### How Date Range Filtering Works

```java
// Backend filters records between dates
List<Attendance> records = attendanceRepository.findByEmployeeAndDateBetween(
    employee,
    startDate,  // e.g., 2025-01-01
    endDate     // e.g., 2025-01-31
);

// Frontend sends date range in API request
GET /api/reports/employee-work-report?employeeId=123&startDate=2025-01-01&endDate=2025-01-31
```

### Default Behavior
If no date range is specified:
- **Default**: Last 7 days from current date
- Frontend automatically sets dates on page load

---

## 4. Complete Time Calculation Flow

### Daily Attendance Flow

```
1. Employee Check-In (Day Start)
   ↓
2. Record Start Time → Calculate Morning OT (if before 8:30 AM)
   ↓
3. Employee Works on Multiple Tickets
   ↓
4. Each Ticket Tracks Status Changes → Calculate Work Minutes per Ticket
   ↓
5. Employee Check-Out (Day End)
   ↓
6. Record End Time → Calculate Evening OT (if after 5:30 PM)
   ↓
7. Calculate Total Regular Work Hours (between 8:30 AM - 5:30 PM)
   ↓
8. Store in Attendance Record:
   - dayStartTime
   - dayEndTime
   - totalWorkMinutes (regular hours only)
   - morningOtMinutes
   - eveningOtMinutes
```

### Reporting Flow

```
1. User Selects Date Range (startDate, endDate)
   ↓
2. Backend Queries Database
   - Filter attendance records by date range
   - Filter job cards by completion date range
   ↓
3. Calculate Aggregations
   - Sum morning OT across all days
   - Sum evening OT across all days
   - Sum work minutes per employee
   - Calculate weight points from completed jobs
   ↓
4. Format and Return Report Data
   ↓
5. Frontend Displays Report
   - Format minutes as "Xh Ym"
   - Show date as "MMM dd, yyyy"
   - Display in tables/charts
```

---

## 5. Key Data Structures

### Attendance Record
```java
class EmployeeDayAttendance {
    LocalDateTime dayStartTime;      // Check-in time
    LocalDateTime dayEndTime;        // Check-out time
    Integer totalWorkMinutes;        // Regular work (8:30 AM - 5:30 PM)
    Integer morningOtMinutes;        // OT before 8:30 AM
    Integer eveningOtMinutes;        // OT after 5:30 PM
}
```

### Job Card (Ticket)
```java
class MiniJobCard {
    LocalDateTime startTime;         // First STARTED timestamp
    LocalDateTime endTime;           // COMPLETED timestamp
    Integer workMinutes;             // Total time in STARTED status
}
```

### Job Status Log
```java
class JobStatusLog {
    JobStatus newStatus;             // PENDING, TRAVELING, STARTED, ON_HOLD, COMPLETED
    LocalDateTime loggedAt;          // Timestamp of status change
}
```

### Report DTO
```java
class EmployeeDailyWorkTimeReportDTO {
    LocalDate date;
    Integer morningOtMinutes;
    Integer eveningOtMinutes;
    Integer totalOtMinutes;          // morning + evening
    Integer workingMinutes;          // regular work hours
    Double weightEarned;             // sum of job scores
}
```

---

## 6. Time Calculation Examples

### Example 1: Full Day with OT

```
Scenario:
- Check-in: 7:30 AM
- Check-out: 6:30 PM
- 3 tickets completed

Calculation:
Morning OT = 8:30 AM - 7:30 AM = 60 minutes
Regular Work = 5:30 PM - 8:30 AM = 540 minutes (9 hours)
Evening OT = 6:30 PM - 5:30 PM = 60 minutes

Total Day Time = 60 + 540 + 60 = 660 minutes (11 hours)
```

### Example 2: Multiple Tickets in One Day

```
Ticket 1:
09:00 AM - STARTED
09:45 AM - COMPLETED
Work Time = 45 minutes

Ticket 2:
10:00 AM - STARTED
10:30 AM - ON_HOLD
11:00 AM - STARTED
12:00 PM - COMPLETED
Work Time = 30 minutes + 60 minutes = 90 minutes

Ticket 3:
02:00 PM - STARTED
03:30 PM - COMPLETED
Work Time = 90 minutes

Total Work Time from Tickets = 45 + 90 + 90 = 225 minutes (3h 45m)
```

### Example 3: Report for Date Range (Jan 1-7, 2025)

```
Employee: John Doe
Date Range: 2025-01-01 to 2025-01-07

Day-by-Day:
Jan 1: Work=480m, Morning OT=0m, Evening OT=30m
Jan 2: Work=540m, Morning OT=30m, Evening OT=60m
Jan 3: Work=500m, Morning OT=0m, Evening OT=0m
Jan 4: Work=540m, Morning OT=60m, Evening OT=90m
Jan 5: Work=480m, Morning OT=0m, Evening OT=0m
Jan 6: OFF
Jan 7: OFF

Summary:
- Total Days Worked: 5 days
- Total Work Hours: 2540 minutes (42h 20m)
- Total Morning OT: 90 minutes (1h 30m)
- Total Evening OT: 180 minutes (3h)
- Total OT: 270 minutes (4h 30m)
- Total Weight Earned: 125 points
```

---

## 7. Important Notes

### Timezone
- All times use **Asia/Colombo** timezone
- Configured in both frontend and backend

### Status Exclusions
- **TRAVELING**: Not counted in work minutes (separate metric)
- **ON_HOLD**: Not counted in work minutes (idle time)
- **PENDING**: Not counted (job not started)

### Calculation Triggers
- **Ticket work time**: Calculated when job status changes to COMPLETED
- **Daily OT**: Calculated during check-in (morning OT) and check-out (evening OT)
- **Reports**: Calculated on-demand when user requests report

### Data Accuracy
- All calculations use minute-level precision
- Status change timestamps are recorded to the second
- Duration calculations use Java's `Duration.between()` for accuracy

---

## 8. Technical Implementation Files

| Component | File Location | Lines |
|-----------|---------------|-------|
| Ticket Time Calculation | `back-e/src/main/java/com/ems/service/TicketService.java` | 201-220 |
| OT Calculation | `back-e/src/main/java/com/ems/service/AttendanceService.java` | Various |
| Report Generation | `back-e/src/main/java/com/ems/service/ReportService.java` | 504-839 |
| Time Formatting (Frontend) | `front-e/src/lib/utils/format.ts` | 19-53 |
| Report UI | `front-e/src/app/admin/reports/` | Multiple pages |
| Timezone Config | `back-e/src/main/java/com/ems/config/TimeZoneConfig.java` | Entire file |

---

## Conclusion

The time calculation system is designed to:
1. **Accurately track** actual work time per ticket (excluding travel and idle time)
2. **Fairly calculate** overtime based on official working hours (8:30 AM - 5:30 PM)
3. **Provide flexible reporting** with custom date range selection
4. **Maintain data integrity** through status logs and precise timestamp tracking

All calculations are performed server-side with consistent timezone handling and minute-level precision.
