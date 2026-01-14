# Deployment Build Fix Guide

## Build Error

```
[ERROR] cannot find symbol
  symbol:   class DailyTimeTrackingAndPerformanceReportDTO
  symbol:   class EmployeeAchievementReportDTO
```

## Root Cause

The new DTO files are committed to Git but the deployment build environment may be:
1. Building from a cached state
2. Building from the wrong branch
3. Not seeing the newly added files

## Files Added (Committed in f7279f7)

```
✅ back-e/src/main/java/com/ems/dto/DailyTimeTrackingAndPerformanceReportDTO.java
✅ back-e/src/main/java/com/ems/dto/EmployeeAchievementReportDTO.java
✅ back-e/src/main/java/com/ems/service/ReportService.java (updated)
✅ back-e/src/main/java/com/ems/controller/AdminReportController.java (updated)
```

## Fix Steps

### Step 1: Verify Git Branch
Ensure deployment is building from the correct branch:
```bash
git branch
# Should show: * claude/document-time-calculation-Qx3Px

git log --oneline -1
# Should show: 97b4d96 Add comprehensive documentation for new reporting system
```

### Step 2: Verify Files Exist in Repository
```bash
git ls-files | grep DailyTimeTrackingAndPerformanceReportDTO
git ls-files | grep EmployeeAchievementReportDTO
```

Should output:
```
back-e/src/main/java/com/ems/dto/DailyTimeTrackingAndPerformanceReportDTO.java
back-e/src/main/java/com/ems/dto/EmployeeAchievementReportDTO.java
```

### Step 3: Clear Deployment Cache

**For Railway/Render/Heroku:**
1. Go to deployment settings
2. Clear build cache
3. Trigger manual redeploy

**For Docker builds:**
```bash
docker builder prune -af
```

**For local Maven:**
```bash
cd back-e
mvn clean install -DskipTests
```

### Step 4: Force Push (if needed)
If the remote doesn't have the latest commits:
```bash
git push -f origin claude/document-time-calculation-Qx3Px
```

### Step 5: Verify File Contents

Check that the files have proper content:
```bash
# Should show Java class with Lombok annotations
cat back-e/src/main/java/com/ems/dto/DailyTimeTrackingAndPerformanceReportDTO.java | head -20
```

Expected output:
```java
package com.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTimeTrackingAndPerformanceReportDTO {
    // ... fields
}
```

## Alternative: Manual File Creation

If Git sync issues persist, manually create the files:

### 1. DailyTimeTrackingAndPerformanceReportDTO.java
Location: `back-e/src/main/java/com/ems/dto/DailyTimeTrackingAndPerformanceReportDTO.java`

Get content from:
```bash
git show f7279f7:back-e/src/main/java/com/ems/dto/DailyTimeTrackingAndPerformanceReportDTO.java
```

### 2. EmployeeAchievementReportDTO.java
Location: `back-e/src/main/java/com/ems/dto/EmployeeAchievementReportDTO.java`

Get content from:
```bash
git show f7279f7:back-e/src/main/java/com/ems/dto/EmployeeAchievementReportDTO.java
```

## Verify Build Locally

Before deploying, test the build locally:

```bash
cd back-e
mvn clean compile
```

Should compile without errors.

## Common Issues

### Issue 1: Wrong Branch
**Symptom:** Files don't exist when you check
**Solution:** Switch to correct branch
```bash
git checkout claude/document-time-calculation-Qx3Px
git pull origin claude/document-time-calculation-Qx3Px
```

### Issue 2: Cached Build
**Symptom:** Build shows old code despite new commits
**Solution:** Clear all caches and rebuild from scratch

### Issue 3: File Permissions
**Symptom:** Files exist but can't be read
**Solution:**
```bash
chmod 644 back-e/src/main/java/com/ems/dto/*.java
```

### Issue 4: Lombok Not Processing
**Symptom:** Errors about @Data, @Builder annotations
**Solution:** Ensure Lombok is in dependencies
```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <scope>provided</scope>
</dependency>
```

## Expected Build Output

When build succeeds, you should see:
```
[INFO] Compiling 124 source files to /app/target/classes
[INFO] BUILD SUCCESS
```

## Contact Points

If issue persists after all steps:
1. Check deployment logs for detailed stack trace
2. Verify Maven dependencies are downloading
3. Check if there are any network issues blocking Maven Central

## Quick Verification Command

Run this to verify everything is in place:
```bash
cd /path/to/EMS-METRO-F-AND-B
echo "Checking branch..."
git branch | grep '*'
echo "Checking files..."
ls -l back-e/src/main/java/com/ems/dto/DailyTimeTracking*.java
ls -l back-e/src/main/java/com/ems/dto/EmployeeAchievement*.java
echo "Checking imports in ReportService..."
grep -n "DailyTimeTrackingAndPerformanceReportDTO" back-e/src/main/java/com/ems/service/ReportService.java | head -5
echo "Done!"
```

All checks should pass without errors.
