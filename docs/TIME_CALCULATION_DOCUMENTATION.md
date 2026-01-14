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
- **Both STARTED and TRAVELING statuses count as work time**
- Time is calculated from status change logs (`JobStatusLog`)
- Work time = Sum of all duration periods where status = STARTED or TRAVELING

### Example
```
09:00 AM - Status: TRAVELING (going to job site)
09:30 AM - Status: STARTED (working)
10:30 AM - Status: ON_HOLD (break)
11:00 AM - Status: STARTED (resumed)
12:00 PM - Status: COMPLETED

Total Work Time = (09:30 - 09:00) + (10:30 - 09:00) + (12:00 - 11:00)
                = 30 minutes + 90 minutes + 60 minutes
                = 180 minutes (3 hours or 3.0h)
```

### Implementation
**File**: `back-e/src/main/java/com/ems/service/TicketService.java:201-220`

```java
private void calculateWorkMinutes(MiniJobCard miniJobCard) {
    // Iterate through status logs in chronological order
    // When STARTED or TRAVELING → track start time
    // When ON_HOLD or COMPLETED → calculate duration since STARTED/TRAVELING
    // Sum all durations to get total work minutes
    // Both STARTED and TRAVELING statuses are counted as productive work time
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
Morning OT = 8:30 AM - 7:00 AM = 90 minutes (1.5h)

Check-in: 8:30 AM (exactly)
Morning OT = 0 minutes (no OT if sign-in is exactly 8:30 AM)
```

#### Evening OT (After 5:30 PM)
Any time worked **after 5:30 PM** counts as evening overtime.

**Example:**
```
Check-out: 7:00 PM
Evening OT = 7:00 PM - 5:30 PM = 90 minutes (1.5h)

Check-out: 5:30 PM (exactly)
Evening OT = 0 minutes (no OT if sign-out is exactly 5:30 PM)
```

#### Regular Working Hours (8:30 AM - 5:30 PM)
Only the time within official hours counts as regular work time.

**Edge Case Handling:**
- Sign-in at **exactly 8:30 AM** = No morning OT, regular work starts at 8:30 AM
- Sign-out at **exactly 5:30 PM** = No evening OT, regular work ends at 5:30 PM
- Sign-in at **8:31 AM** = No morning OT, regular work starts at 8:31 AM
- Sign-out at **5:29 PM** = No evening OT, regular work ends at 5:29 PM

**Example:**
```
Check-in: 7:00 AM
Check-out: 6:00 PM

Morning OT = 7:00 AM to 8:30 AM = 90 minutes (1.5h)
Regular Work = 8:30 AM to 5:30 PM = 540 minutes (9.0h)
Evening OT = 5:30 PM to 6:00 PM = 30 minutes (0.5h)

Total Time = 90 + 540 + 30 = 660 minutes (11.0h)
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

All reports can be **downloaded as PDF** by admin users for record-keeping and analysis.

#### A. Daily Time Tracking Report
Shows daily breakdown of work activities.

**Includes:**
- Date
- Employee name
- Total work minutes (STARTED + TRAVELING combined)
- Idle minutes (ON_HOLD status)
- Travel minutes (TRAVELING status - shown separately for analysis)

**Date Range:** User selects start date and end date (default: last 7 days)

**Export:** ✅ PDF download available

#### B. Performance & OT Report
Shows overtime and performance metrics.

**Includes:**
- Employee name
- Morning OT (displayed as decimal hours, e.g., 1.5h)
- Evening OT (displayed as decimal hours, e.g., 2.0h)
- Total OT (displayed as decimal hours, e.g., 3.5h)
- Work hours - regular time (displayed as decimal hours, e.g., 9.0h)
- Weight points earned

**Date Range:** Custom start and end date selection

**Export:** ✅ PDF download available

#### C. Employee Work Report (Most Comprehensive)
Detailed report with daily records and job completion.

**Includes:**
- Daily attendance records:
  - Check-in time
  - Check-out time
  - Morning OT (decimal hours)
  - Evening OT (decimal hours)
  - Total work minutes (decimal hours)
- Jobs completed each day with scores
- Daily average scores
- Summary statistics:
  - Total days worked
  - Total OT hours (decimal format)
  - Total weight earned
  - Overall average score

**Date Range:** Filtered by start date and end date

**Export:** ✅ PDF download available

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
08:45 AM - TRAVELING (going to first job site)
09:00 AM - STARTED (arrived and working)
09:45 AM - COMPLETED
Work Time = 15 minutes (travel) + 45 minutes (work) = 60 minutes

Ticket 2:
10:00 AM - TRAVELING (going to second job site)
10:15 AM - STARTED
10:30 AM - ON_HOLD (break - not counted)
11:00 AM - STARTED (resumed)
12:00 PM - COMPLETED
Work Time = 15 minutes (travel) + 15 minutes (work) + 60 minutes (work) = 90 minutes

Ticket 3:
02:00 PM - STARTED
03:30 PM - COMPLETED
Work Time = 90 minutes

Total Work Time from Tickets = 60 + 90 + 90 = 240 minutes (4.0h)
```

### Example 3: Report for Date Range (Jan 1-7, 2025)

```
Employee: John Doe
Date Range: 2025-01-01 to 2025-01-07

Day-by-Day (displayed in decimal hours):
Jan 1: Work=8.0h, Morning OT=0.0h, Evening OT=0.5h
Jan 2: Work=9.0h, Morning OT=0.5h, Evening OT=1.0h
Jan 3: Work=8.3h, Morning OT=0.0h, Evening OT=0.0h
Jan 4: Work=9.0h, Morning OT=1.0h, Evening OT=1.5h
Jan 5: Work=8.0h, Morning OT=0.0h, Evening OT=0.0h
Jan 6: OFF
Jan 7: OFF

Summary (stored in minutes, displayed as decimal hours):
- Total Days Worked: 5 days
- Total Work Hours: 2540 minutes = 42.3h
- Total Morning OT: 90 minutes = 1.5h
- Total Evening OT: 180 minutes = 3.0h
- Total OT: 270 minutes = 4.5h
- Total Weight Earned: 125 points

PDF Export: ✅ Available for download with all details above
```

---

## 7. Important Notes

### Timezone
- All times use **Asia/Colombo** timezone
- Configured in both frontend and backend

### Status Inclusions & Exclusions

**Counted as Work Time:**
- **STARTED**: Active work on the job
- **TRAVELING**: Travel to/from job site (counted as productive work time)

**Not Counted as Work Time:**
- **ON_HOLD**: Idle time (breaks, waiting)
- **PENDING**: Job not started yet
- **COMPLETED**: Job finished
- **CANCEL**: Job cancelled

### Display Format
- **Backend**: Calculates and stores all time values in **minutes** (integer)
- **Frontend**: Displays time as **decimal hours** for easier reading
  - Example: 150 minutes = 2.5h (not "2h 30m")
  - Example: 540 minutes = 9.0h
  - Example: 90 minutes = 1.5h
- **Reports**: All exported PDFs show time in decimal hour format

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
1. **Accurately track** actual work time per ticket (including both active work and travel time, excluding only idle time)
2. **Fairly calculate** overtime based on official working hours (8:30 AM - 5:30 PM) with proper edge case handling
3. **Provide flexible reporting** with custom date range selection and PDF export functionality
4. **Maintain data integrity** through status logs and precise timestamp tracking
5. **Display time efficiently** using decimal hours for easy reading while storing in minutes for accuracy

All calculations are performed server-side with consistent timezone handling (Asia/Colombo) and minute-level precision. Reports can be downloaded as PDF for record-keeping and analysis.
