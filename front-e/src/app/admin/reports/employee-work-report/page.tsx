'use client';

import { useState, useEffect } from 'react';
import { reportService, userService } from '@/lib/services/admin.service';
import {
  EmployeeWorkReportDTO,
  DailyWorkRecord,
  User,
  UserRole,
} from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatDateTime, formatMinutes } from '@/lib/utils/format';
import {
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Briefcase,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EmployeeWorkReportPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [report, setReport] = useState<EmployeeWorkReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({
        page: 0,
        size: 1000,
      });
      setEmployees(response.content);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEmployeeId || !startDate || !endDate) {
      setError('Please select an employee and date range');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await reportService.getEmployeeWorkReport(
        selectedEmployeeId,
        startDate,
        endDate
      );
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatMinutesAsDecimal = (minutes: number): string => {
    if (!minutes || minutes === 0) return '0.0h';
    const hours = (minutes / 60).toFixed(1);
    return `${hours}h`;
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Work Report', 14, yPosition);
    yPosition += 8;

    // Employee Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employee: ${report.employeeName}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Period: ${formatDate(report.reportStartDate)} - ${formatDate(report.reportEndDate)}`, 14, yPosition);
    yPosition += 10;

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Days Worked: ${report.summary.totalDaysWorked}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Total Work Hours: ${formatMinutesAsDecimal(report.summary.totalWorkMinutes)}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Total OT: ${formatMinutesAsDecimal(report.summary.totalOtMinutes)}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Total Weight Earned: ${report.summary.totalWeight} pts`, 14, yPosition);
    yPosition += 5;
    doc.text(`Overall Average Score: ${report.summary.overallAverageScore.toFixed(2)} / 10`, 14, yPosition);
    yPosition += 10;

    // Daily Records Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Records', 14, yPosition);
    yPosition += 6;

    const dailyTableData = report.dailyRecords.map((day: DailyWorkRecord) => [
      formatDate(day.date),
      day.checkInTime ? new Date(day.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      day.checkOutTime ? new Date(day.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      formatMinutesAsDecimal(day.totalWorkMinutes),
      formatMinutesAsDecimal(day.totalOtMinutes),
      day.dailyScore || 0,
      day.dailyAverageScore ? day.dailyAverageScore.toFixed(1) : 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Check In', 'Check Out', 'Work', 'OT', 'Score', 'Avg']],
      body: dailyTableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 18 }
      }
    });

    // Jobs Completed Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    if (finalY < 270) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Jobs Summary', 14, finalY);

      const jobsTableData = report.dailyRecords.flatMap((day: DailyWorkRecord) =>
        day.jobs.map(job => [
          formatDate(day.date),
          job.ticketNumber || 'N/A',
          job.generator || 'N/A',
          job.jobType || 'N/A',
          formatMinutesAsDecimal(job.workMinutes),
          job.scored ? `${job.weight} pts` : 'Not scored'
        ])
      ).slice(0, 15); // Limit to first 15 jobs to fit on page

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Ticket #', 'Generator', 'Type', 'Work Time', 'Score']],
        body: jobsTableData,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 28 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 }
        }
      });

      if (report.dailyRecords.flatMap(d => d.jobs).length > 15) {
        const footnoteY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Note: Showing first 15 jobs only. Full details available in the web interface.', 14, footnoteY);
      }
    }

    // Save PDF
    const employeeName = report.employeeName.replace(/\s+/g, '_');
    doc.save(`Employee_Work_Report_${employeeName}_${report.reportStartDate}_to_${report.reportEndDate}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Employee Work Report
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive work report including attendance, jobs, and performance
          scores
        </p>
      </div>

      {/* Report Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) =>
                setSelectedEmployeeId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading || !selectedEmployeeId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Report Display */}
      {!loading && report && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {report.employeeName}
                </h2>
                <p className="text-gray-600">{report.employeeEmail}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Report Period: {formatDate(report.reportStartDate)} to{' '}
                  {formatDate(report.reportEndDate)}
                </p>
              </div>
              <div className="flex gap-3 print:hidden">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-corporate-blue text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Printer size={18} />
                  Print Report
                </button>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center text-blue-600 mb-2">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Days Worked</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {report.summary.totalDaysWorked}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center text-green-600 mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Total Hours</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {formatMinutes(report.summary.totalWorkMinutes)}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center text-orange-600 mb-2">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">OT Hours</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {formatMinutes(report.summary.totalOtMinutes)}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center text-purple-600 mb-2">
                  <Briefcase className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Jobs Done</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {report.summary.totalJobsCompleted}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center text-yellow-600 mb-2">
                  <Award className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Avg Score</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {report.summary.overallAverageScore.toFixed(1)}
                </p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="flex items-center text-pink-600 mb-2">
                  <Star className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Total Points</span>
                </div>
                <p className="text-2xl font-bold text-pink-900">
                  {report.summary.totalWeightedScore}
                </p>
              </div>
            </div>
          </Card>

          {/* Daily Records */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              Daily Work Records
            </h3>

            {report.dailyRecords.map((day: DailyWorkRecord) => (
              <Card key={day.date}>
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {formatDate(day.date)}
                      </h4>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>
                          Check-in:{' '}
                          {day.checkInTime
                            ? new Date(day.checkInTime).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                        <span>
                          Check-out:{' '}
                          {day.checkOutTime
                            ? new Date(day.checkOutTime).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Work: {formatMinutes(day.totalWorkMinutes)} | OT:{' '}
                        {formatMinutes(day.totalOtMinutes)}
                      </div>
                      {day.dailyScore && (
                        <div className="text-sm font-medium text-blue-600 mt-1">
                          Daily Score: {day.dailyScore} (Avg:{' '}
                          {day.dailyAverageScore?.toFixed(1)})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Jobs for this day */}
                {day.jobs.length > 0 ? (
                  <div className="space-y-3">
                    {day.jobs.map((job) => (
                      <div
                        key={job.miniJobCardId}
                        className="bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {job.ticketNumber}
                              </span>
                              <StatusBadge status={job.jobStatus as any} />
                              {job.approved && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {job.scored && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {job.ticketTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatMinutes(job.workMinutes)} worked
                            </div>
                            {job.scored && (
                              <div className="text-sm text-blue-600 mt-1">
                                Score: {job.weight} {'⭐'.repeat(job.weight)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.generatorName} - {job.generatorLocation}
                          </div>
                          <div className="bg-gray-200 px-2 py-1 rounded text-xs">
                            {job.jobType}
                          </div>
                          <div className="bg-gray-200 px-2 py-1 rounded text-xs">
                            Weight: {job.weight}
                          </div>
                        </div>

                        {!job.scored && job.approved && (
                          <div className="mt-2 flex items-center text-sm text-orange-600">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Approved but not scored yet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No jobs completed on this day
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Summary Footer */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Period Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Work Time:</span>
                <p className="font-medium text-gray-900">
                  {formatMinutes(report.summary.totalWorkMinutes)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Total OT:</span>
                <p className="font-medium text-gray-900">
                  {formatMinutes(report.summary.totalOtMinutes)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Jobs Completed:</span>
                <p className="font-medium text-gray-900">
                  {report.summary.totalJobsCompleted}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Jobs Scored:</span>
                <p className="font-medium text-gray-900">
                  {report.summary.totalJobsScored}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Pending Scores:</span>
                <p className="font-medium text-gray-900">
                  {report.summary.totalJobsPending}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Overall Average Score:</span>
                <p className="font-medium text-gray-900">
                  {report.summary.overallAverageScore.toFixed(2)} / 10
                </p>
              </div>
              {report.summary.maxDailyScore && (
                <div>
                  <span className="text-gray-600">Highest Daily Score:</span>
                  <p className="font-medium text-gray-900">
                    {report.summary.maxDailyScore}
                  </p>
                </div>
              )}
              {report.summary.minDailyScore && (
                <div>
                  <span className="text-gray-600">Lowest Daily Score:</span>
                  <p className="font-medium text-gray-900">
                    {report.summary.minDailyScore}
                  </p>
                </div>
              )}
              {report.summary.averageDailyScore && (
                <div>
                  <span className="text-gray-600">Average Daily Score:</span>
                  <p className="font-medium text-gray-900">
                    {report.summary.averageDailyScore.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* No Report State */}
      {!loading && !report && !error && (
        <Card>
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Report Generated
            </h3>
            <p className="text-gray-600">
              Select an employee and date range, then click &quot;Generate
              Report&quot;
            </p>
          </div>
        </Card>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </AdminLayout>
  );
}
