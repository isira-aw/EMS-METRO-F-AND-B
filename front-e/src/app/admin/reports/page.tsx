'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService, userService } from '@/lib/services/admin.service';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  DailyTimeTrackingReportDTO,
  EmployeeDailyWorkTimeReportDTO,
  User,
} from '@/types';
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
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Reports data
  const [timeTrackingReport, setTimeTrackingReport] = useState<DailyTimeTrackingReportDTO[]>([]);
  const [workTimeReport, setWorkTimeReport] = useState<EmployeeDailyWorkTimeReportDTO[]>([]);

  // UI states
  const [loadingReport1, setLoadingReport1] = useState(false);
  const [loadingReport2, setLoadingReport2] = useState(false);
  const [showReport1, setShowReport1] = useState(false);
  const [showReport2, setShowReport2] = useState(false);

  useEffect(() => {
    loadEmployees();
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setLoading(false);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({ page: 0, size: 1000 });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleGenerateReport1 = async () => {
    if (!startDate || !endDate) return alert('Please select date range');
    setLoadingReport1(true);
    try {
      const employeeId = selectedEmployee ? parseInt(selectedEmployee) : undefined;
      const data = await reportService.getDailyTimeTracking(startDate, endDate, employeeId);
      setTimeTrackingReport(data);
      setShowReport1(true);
      setShowReport2(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport1(false);
    }
  };

  const handleGenerateReport2 = async () => {
    if (!startDate || !endDate) return alert('Please select date range');
    if (!selectedEmployee) return alert('Please select an employee');
    setLoadingReport2(true);
    try {
      const data = await reportService.getEmployeeDailyWorkTime(parseInt(selectedEmployee), startDate, endDate);
      setWorkTimeReport(data);
      setShowReport2(true);
      setShowReport1(false);
    } catch (error: any) {
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingReport2(false);
    }
  };

  const formatTime = (datetime?: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateLabel = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatMinutesLocal = (minutes: number) => {
    if (!minutes || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const generateMapUrl = (locationPath?: any[]) => {
    if (!locationPath || locationPath.length === 0) return null;
    const coords = locationPath
      .map(point => `${point.latitude},${point.longitude}`)
      .join('/');
    return `https://www.google.com/maps/dir/${coords}`;
  };

  const formatMinutesAsDecimal = (minutes: number): string => {
    if (!minutes || minutes === 0) return '0.0h';
    const hours = (minutes / 60).toFixed(1);
    return `${hours}h`;
  };

  const downloadReport1PDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Time Tracking Report', 14, 20);

    // Add date range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`, 14, 28);

    // Prepare table data
    const tableData = timeTrackingReport.map(row => [
      row.employeeName,
      formatDateLabel(row.date),
      `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`,
      row.location || 'N/A',
      formatMinutesAsDecimal(row.dailyWorkingMinutes),
      formatMinutesAsDecimal(row.idleMinutes),
      formatMinutesAsDecimal(row.travelMinutes),
      formatMinutesAsDecimal(row.totalMinutes)
    ]);

    // Generate table
    autoTable(doc, {
      startY: 35,
      head: [['Employee', 'Date', 'Shift', 'Location', 'Working', 'Idle', 'Travel', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 }
      }
    });

    // Save the PDF
    doc.save(`Daily_Time_Tracking_Report_${startDate}_to_${endDate}.pdf`);
  };

  const downloadReport2PDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance & OT Report', 14, 20);

    // Add date range and employee info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const employeeName = employees.find(e => e.id.toString() === selectedEmployee)?.fullName || 'Unknown';
    doc.text(`Employee: ${employeeName}`, 14, 28);
    doc.text(`Period: ${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`, 14, 34);

    // Add summary statistics
    const totalDays = workTimeReport.length;
    const totalWork = formatMinutesAsDecimal(workTimeReport.reduce((sum, r) => sum + r.workingMinutes, 0));
    const totalOT = formatMinutesAsDecimal(workTimeReport.reduce((sum, r) => sum + r.totalOtMinutes, 0));
    const totalWeight = workTimeReport.reduce((sum, r) => sum + r.totalWeightEarned, 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 14, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days: ${totalDays} | Active Duty: ${totalWork} | Total OT: ${totalOT} | Weight Score: ${totalWeight} pts`, 14, 50);

    // Prepare table data
    const tableData = workTimeReport.map(row => [
      formatDateLabel(row.date),
      formatTime(row.startTime),
      formatTime(row.endTime),
      formatMinutesAsDecimal(row.morningOtMinutes),
      formatMinutesAsDecimal(row.eveningOtMinutes),
      formatMinutesAsDecimal(row.workingMinutes),
      `${row.totalWeightEarned} pts`
    ]);

    // Generate table
    autoTable(doc, {
      startY: 57,
      head: [['Date', 'Time In', 'Time Out', 'Morning OT', 'Evening OT', 'Work Hours', 'Weight']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24 },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 24 },
        6: { cellWidth: 24 }
      }
    });

    // Save the PDF
    doc.save(`Performance_OT_Report_${employeeName}_${startDate}_to_${endDate}.pdf`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="px-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Analytics & Reports</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-1">Operational Performance Insights</p>
        </div>

        {/* Filters Card */}
        <Card className="p-8 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <UserIcon size={16} className="text-corporate-blue" /> Target Personnel
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue appearance-none"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-corporate-blue" /> From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-corporate-blue" /> To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue"
              />
            </div>
          </div>
        </Card>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={handleGenerateReport1}
            disabled={loadingReport1}
            className="group text-left p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-md hover:shadow-2xl hover:border-corporate-blue transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-corporate-blue/10 transition-colors">
                <Clock className="text-corporate-blue" size={32} />
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-corporate-blue group-hover:translate-x-2 transition-all" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Daily Time Tracking</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase">Log of start/end times, location, and productivity metrics.</p>
            {loadingReport1 && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">Processing...</div>}
          </button>

          <button 
            onClick={handleGenerateReport2}
            disabled={loadingReport2 || !selectedEmployee}
            className={`group text-left p-8 bg-white border-2 rounded-[2.5rem] shadow-md transition-all relative overflow-hidden ${!selectedEmployee ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-2xl hover:border-green-500 border-slate-100'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-green-50 transition-colors">
                <TrendingUp className="text-green-600" size={32} />
              </div>
              <ChevronRight className="text-slate-200 group-hover:text-green-500 group-hover:translate-x-2 transition-all" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Performance & OT Report</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase">Overtime calculation and weight points for individual employees.</p>
            {!selectedEmployee && <div className="mt-4 text-[10px] font-black text-red-500 uppercase italic">Select an employee to unlock</div>}
            {loadingReport2 && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center font-black uppercase text-xs">Processing...</div>}
          </button>
        </div>

        {/* Results Section */}
        {(showReport1 || showReport2) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-0 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm"><FileText size={24} className="text-corporate-blue" /></div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Generated Data</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{formatDateLabel(startDate)} — {formatDateLabel(endDate)}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={showReport1 ? downloadReport1PDF : downloadReport2PDF}
                    className="flex items-center gap-2 px-5 py-3 bg-corporate-blue text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md font-black text-xs uppercase"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => { setShowReport1(false); setShowReport2(false); }}
                    className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm text-slate-400 hover:text-red-500"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Report 1 Table */}
              {showReport1 && (
                <div className="p-8">
                  {timeTrackingReport.length === 0 ? (
                    <div className="py-20 text-center"><BarChart3 size={48} className="mx-auto text-slate-200 mb-4" /><p className="font-black text-slate-400 uppercase">No data for this range</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-100">
                            {['Employee', 'Date', 'Shift', 'Location', 'Working', 'Idle', 'Travel', 'Total', 'Location Map'].map((h) => (
                              <th key={h} className="pb-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {timeTrackingReport.map((row, i) => {
                            const mapUrl = generateMapUrl(row.locationPath);
                            return (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 text-sm font-black text-slate-900 uppercase">{row.employeeName}</td>
                                <td className="py-6 text-sm font-bold text-slate-600">{formatDateLabel(row.date)}</td>
                                <td className="py-6">
                                  <div className="text-[10px] font-black text-corporate-blue uppercase">{formatTime(row.startTime)}</div>
                                  <div className="text-[10px] font-black text-slate-300 uppercase">{formatTime(row.endTime)}</div>
                                </td>
                                <td className="py-6 text-sm font-bold text-slate-600 flex items-center gap-1"><MapPin size={14} className="text-slate-300" /> {row.location || '—'}</td>
                                <td className="py-6 text-sm font-black text-slate-700">{formatMinutesLocal(row.dailyWorkingMinutes)}</td>
                                <td className="py-6 text-sm font-black text-orange-500">{formatMinutesLocal(row.idleMinutes)}</td>
                                <td className="py-6 text-sm font-black text-blue-500">{formatMinutesLocal(row.travelMinutes)}</td>
                                <td className="py-6 text-sm font-black text-slate-900">{formatMinutesLocal(row.totalMinutes)}</td>
                                <td className="py-6">
                                  {mapUrl ? (
                                    <a
                                      href={mapUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-corporate-blue text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                      <Map size={14} />
                                      View Path
                                      <ExternalLink size={12} />
                                    </a>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-300 uppercase">No data</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Report 2 Content */}
              {showReport2 && (
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Days', val: workTimeReport.length, color: 'text-slate-900' },
                      { label: 'Active Duty', val: formatMinutesLocal(workTimeReport.reduce((sum, r) => sum + r.workingMinutes, 0)), color: 'text-corporate-blue' },
                      { label: 'Total OT', val: formatMinutesLocal(workTimeReport.reduce((sum, r) => sum + r.totalOtMinutes, 0)), color: 'text-orange-500' },
                      { label: 'Weight Score', val: workTimeReport.reduce((sum, r) => sum + r.totalWeightEarned, 0), color: 'text-green-600' }
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-100">
                          {['Date', 'Time In', 'Time Out', 'Morning OT', 'Evening OT', 'Work Hours', 'Weight'].map((h) => (
                            <th key={h} className="pb-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {workTimeReport.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-6 text-sm font-black text-slate-900 uppercase">{formatDateLabel(row.date)}</td>
                            <td className="py-6 text-sm font-bold text-slate-600">{formatTime(row.startTime)}</td>
                            <td className="py-6 text-sm font-bold text-slate-600">{formatTime(row.endTime)}</td>
                            <td className="py-6 text-sm font-black text-slate-700">{formatMinutesLocal(row.morningOtMinutes)}</td>
                            <td className="py-6 text-sm font-black text-slate-700">{formatMinutesLocal(row.eveningOtMinutes)}</td>
                            <td className="py-6 text-sm font-black text-corporate-blue">{formatMinutesLocal(row.workingMinutes)}</td>
                            <td className="py-6"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black uppercase">+{row.totalWeightEarned} pts</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}