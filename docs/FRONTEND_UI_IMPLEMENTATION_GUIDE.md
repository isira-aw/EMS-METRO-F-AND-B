# Frontend UI Implementation Guide for New Reports

## Status

✅ **Backend Complete**
- DTOs created
- Service methods implemented
- Controller endpoints ready
- API endpoints: `/api/admin/reports/daily-time-tracking-and-performance` and `/api/admin/reports/employee-achievement/{employeeId}`

✅ **Frontend Types & Services Complete**
- TypeScript interfaces added to `src/types/index.ts`
- Service methods added to `src/lib/services/admin.service.ts`
- `reportService.getDailyTimeTrackingAndPerformance()`
- `reportService.getEmployeeAchievement()`

🔨 **TODO: Frontend UI**
- Update `/admin/reports` page with new report cards
- Add report tables/views
- Implement PDF export functions

---

## UI Updates Needed for `/admin/reports` Page

### 1. Add State Variables

Add after line 48 in `page.tsx`:

```typescript
// New report states
const [mergedReport, setMergedReport] = useState<DailyTimeTrackingAndPerformanceReportDTO[]>([]);
const [achievementReport, setAchievementReport] = useState<EmployeeAchievementReportDTO[]>([]);
const [loadingReport3, setLoadingReport3] = useState(false);
const [loadingReport4, setLoadingReport4] = useState(false);
const [showReport3, setShowReport3] = useState(false);
const [showReport4, setShowReport4] = useState(false);
```

### 2. Update Imports

Add to the imports from '@/types' (line 9-13):

```typescript
import {
  DailyTimeTrackingReportDTO,
  DailyTimeTrackingAndPerformanceReportDTO,  // ADD THIS
  EmployeeAchievementReportDTO,               // ADD THIS
  EmployeeDailyWorkTimeReportDTO,
  User,
} from '@/types';
```

Add to icon imports (line 25):

```typescript
import {
  Calendar,
  User as UserIcon,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
  X,
  ChevronRight,
  BarChart3,
  Map,
  ExternalLink,
  Download,
  Award,        // ADD THIS
  Target,       // ADD THIS
  Zap,          // ADD THIS
} from 'lucide-react';
```

### 3. Add Handler Functions

Add after `handleGenerateReport2` function:

```typescript
const handleGenerateReport3 = async () => {
  if (!startDate || !endDate) return alert('Please select date range');
  setLoadingReport3(true);
  try {
    const employeeId = selectedEmployee ? parseInt(selectedEmployee) : undefined;
    const data = await reportService.getDailyTimeTrackingAndPerformance(startDate, endDate, employeeId);
    setMergedReport(data);
    setShowReport3(true);
    setShowReport1(false);
    setShowReport2(false);
    setShowReport4(false);
  } catch (error: any) {
    alert('Error generating report: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoadingReport3(false);
  }
};

const handleGenerateReport4 = async () => {
  if (!startDate || !endDate) return alert('Please select date range');
  if (!selectedEmployee) return alert('Please select an employee for achievement report');
  setLoadingReport4(true);
  try {
    const data = await reportService.getEmployeeAchievement(parseInt(selectedEmployee), startDate, endDate);
    setAchievementReport(data);
    setShowReport4(true);
    setShowReport1(false);
    setShowReport2(false);
    setShowReport3(false);
  } catch (error: any) {
    alert('Error generating report: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoadingReport4(false);
  }
};
```

### 4. Add PDF Export Functions

Add after `downloadReport2PDF` function:

```typescript
const downloadMergedReportPDF = () => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Time Tracking & Performance Report', 14, 20);

  // Date range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`, 14, 28);

  // Table data
  const tableData = mergedReport.map(row => [
    row.employeeName,
    formatDateLabel(row.date),
    formatMinutesAsDecimal(row.dailyWorkingMinutes),
    formatMinutesAsDecimal(row.totalOtMinutes),
    row.jobsCompleted,
    row.totalWeightEarned,
    row.averageScore.toFixed(1)
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Employee', 'Date', 'Work Time', 'Total OT', 'Jobs', 'Weight', 'Avg Score']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' }
  });

  doc.save(`Merged_Report_${startDate}_to_${endDate}.pdf`);
};

const downloadAchievementReportPDF = () => {
  const doc = new jsPDF();
  const employeeName = employees.find(e => e.id.toString() === selectedEmployee)?.fullName || 'Unknown';

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Achievement Report', 14, 20);

  // Employee and period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employee: ${employeeName}`, 14, 28);
  doc.text(`Period: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`, 14, 34);

  let yPos = 44;

  achievementReport.forEach((dayReport, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Daily header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Date: ${formatDateLabel(dayReport.date)}`, 14, yPos);
    yPos += 6;

    // Summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Tickets: ${dayReport.dailySummary.totalTickets} | Completed: ${dayReport.dailySummary.completedTickets} | ` +
      `Work: ${formatMinutesAsDecimal(dayReport.dailySummary.totalWorkMinutes)} | Weight: ${dayReport.dailySummary.totalWeightEarned}`,
      14, yPos
    );
    yPos += 8;

    // Tickets table
    const ticketData = dayReport.ticketAchievements.map(ticket => [
      ticket.ticketNumber,
      ticket.generatorName,
      formatMinutesAsDecimal(ticket.workMinutes),
      ticket.weight,
      ticket.currentStatus
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Ticket #', 'Generator', 'Work Time', 'Score', 'Status']],
      body: ticketData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      margin: { left: 14 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`Achievement_Report_${employeeName}_${startDate}_to_${endDate}.pdf`);
};
```

### 5. Add New Report Cards

Add after the existing report buttons (after line 211):

```tsx
{/* Report 3: Merged Report */}
<button
  onClick={handleGenerateReport3}
  disabled={loadingReport3}
  className="group text-left p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-md hover:shadow-2xl hover:border-purple-500 transition-all relative overflow-hidden"
>
  <div className="flex justify-between items-start mb-4">
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-purple-50 transition-colors">
      <Zap className="text-purple-600" size={32} />
    </div>
    <ChevronRight className="text-slate-200 group-hover:text-purple-500 group-hover:translate-x-2 transition-all" />
  </div>
  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
    Merged Report
  </h3>
  <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase">
    Combined time tracking & performance metrics in one comprehensive view
  </p>
  <div className="mt-3 inline-block px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full uppercase">
    ⭐ All-in-One
  </div>
  {loadingReport3 && (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">
      Processing...
    </div>
  )}
</button>

{/* Report 4: Employee Achievement Report */}
<button
  onClick={handleGenerateReport4}
  disabled={loadingReport4 || !selectedEmployee}
  className={`group text-left p-8 bg-white border-2 rounded-[2.5rem] shadow-md transition-all relative overflow-hidden ${
    !selectedEmployee
      ? 'opacity-60 cursor-not-allowed grayscale'
      : 'hover:shadow-2xl hover:border-amber-500 border-slate-100'
  }`}
>
  <div className="flex justify-between items-start mb-4">
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-amber-50 transition-colors">
      <Target className="text-amber-600" size={32} />
    </div>
    <ChevronRight className="text-slate-200 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
  </div>
  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
    Achievement Report
  </h3>
  <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase">
    Ticket-level daily progress with detailed time breakdown per ticket
  </p>
  <div className="mt-3 inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase">
    🎯 Ticket-Level
  </div>
  {!selectedEmployee && (
    <div className="mt-4 text-[10px] font-black text-red-500 uppercase italic">
      Select an employee to unlock
    </div>
  )}
  {loadingReport4 && (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">
      Processing...
    </div>
  )}
</button>
```

### 6. Add Report Display Sections

Add after the existing report results section (around line 330):

```tsx
{/* Merged Report Results */}
{showReport3 && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <Card className="p-0 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Zap size={24} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              Merged Report
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {formatDateLabel(startDate)} — {formatDateLabel(endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadMergedReportPDF}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md font-black text-xs uppercase"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => setShowReport3(false)}
            className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm text-slate-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="p-8">
        {mergedReport.length === 0 ? (
          <div className="py-20 text-center">
            <BarChart3 size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="font-black text-slate-400 uppercase">No data for this range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  {['Employee', 'Date', 'Work', 'Travel', 'OT', 'Jobs', 'Weight', 'Avg Score'].map(h => (
                    <th key={h} className="pb-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mergedReport.map((row, i) => (
                  <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-6 text-sm font-black text-slate-900 uppercase">{row.employeeName}</td>
                    <td className="py-6 text-sm font-bold text-slate-600">{formatDateLabel(row.date)}</td>
                    <td className="py-6 text-sm font-black text-purple-600">
                      {formatMinutesLocal(row.dailyWorkingMinutes)}
                    </td>
                    <td className="py-6 text-sm font-black text-blue-500">
                      {formatMinutesLocal(row.travelMinutes)}
                    </td>
                    <td className="py-6 text-sm font-black text-orange-500">
                      {formatMinutesLocal(row.totalOtMinutes)}
                    </td>
                    <td className="py-6 text-sm font-black text-corporate-blue">{row.jobsCompleted}</td>
                    <td className="py-6 text-sm font-black text-green-600">{row.totalWeightEarned}</td>
                    <td className="py-6 text-sm font-black text-amber-600">
                      {row.averageScore.toFixed(1)} ⭐
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  </div>
)}

{/* Achievement Report Results */}
{showReport4 && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <Card className="p-0 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Target size={24} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              Achievement Report
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {formatDateLabel(startDate)} — {formatDateLabel(endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadAchievementReportPDF}
            className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-md font-black text-xs uppercase"
          >
            <Download size={18} />
            Download PDF
          </button>
          <button
            onClick={() => setShowReport4(false)}
            className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm text-slate-400 hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {achievementReport.length === 0 ? (
          <div className="py-20 text-center">
            <Target size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="font-black text-slate-400 uppercase">No data for this range</p>
          </div>
        ) : (
          achievementReport.map((dayReport, dayIdx) => (
            <div key={dayIdx} className="border-2 border-amber-100 rounded-3xl overflow-hidden">
              {/* Day Header */}
              <div className="bg-gradient-to-r from-amber-50 to-white p-6 border-b border-amber-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      {formatDateLabel(dayReport.date)}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {dayReport.dailySummary.totalTickets} tickets |
                      {dayReport.dailySummary.completedTickets} completed |
                      {formatMinutesLocal(dayReport.dailySummary.totalWorkMinutes)} work time
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-600">
                      {dayReport.dailySummary.totalWeightEarned}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Weight Earned</div>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="p-6 space-y-4">
                {dayReport.ticketAchievements.map((ticket, ticketIdx) => (
                  <div
                    key={ticketIdx}
                    className="bg-white border-2 border-slate-100 rounded-2xl p-5 hover:border-amber-200 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm font-black text-corporate-blue uppercase">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-xs font-bold text-slate-500 mt-1">
                          {ticket.generatorName} @ {ticket.generatorLocation}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            ticket.currentStatus === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {ticket.currentStatus}
                        </span>
                        {ticket.scored && (
                          <span className="text-lg">{'⭐'.repeat(ticket.weight)}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="text-xs font-black text-slate-400 uppercase">Work</div>
                        <div className="text-lg font-black text-purple-600">
                          {formatMinutesLocal(ticket.workMinutes)}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="text-xs font-black text-slate-400 uppercase">Travel</div>
                        <div className="text-lg font-black text-blue-600">
                          {formatMinutesLocal(ticket.travelMinutes)}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="text-xs font-black text-slate-400 uppercase">Idle</div>
                        <div className="text-lg font-black text-orange-600">
                          {formatMinutesLocal(ticket.idleMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  </div>
)}
```

### 7. Update Grid Layout

Change the report cards grid from 2 columns to 2x2 grid. Find the div with the report buttons (around line 294) and change:

```tsx
{/* FROM: */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{/* TO: */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

Keep it the same but ensure all 4 report cards are in the grid.

---

## Summary

After these changes, the `/admin/reports` page will have:

✅ **4 Report Types:**
1. Daily Time Tracking (existing)
2. Performance & OT (existing)
3. **Merged Report** (NEW) - All metrics in one view
4. **Achievement Report** (NEW) - Ticket-level progress

✅ **All Reports Include:**
- Date range filtering
- Employee filtering (where applicable)
- PDF export functionality
- Modern, polished UI with color-coded cards
- Responsive tables with proper formatting

✅ **Key Features:**
- Ticket-level visibility in Achievement Report
- Comprehensive metrics in Merged Report
- Time displayed in decimal hours
- Status badges and score indicators
- Collapsible daily sections for Achievement Report

The UI is designed to match the existing style while clearly differentiating the new report types with unique colors (purple for Merged, amber for Achievement).
