'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logsService, userService } from '@/lib/services/admin.service';
import { ActivityLogResponse, PageResponse, User } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MapPin, Search, Filter, RotateCcw, Calendar, User as UserIcon, ArrowRight, History } from 'lucide-react';

export default function AdminLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<PageResponse<ActivityLogResponse> | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadEmployees();
    loadLogs(0);
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await userService.getEmployees({ page: 0, size: 1000, activeOnly: false });
      setEmployees(response.content);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadLogs = async (page: number) => {
    try {
      setLoading(true);
      const data = await logsService.getAll({
        employeeId: selectedEmployee,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        size: 20,
      });
      setLogs(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadgeColor = (activityType: string) => {
    switch (activityType) {
      case 'DAY_START': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'DAY_END': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'STATUS_UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'JOB_APPROVED': return 'bg-green-50 text-green-700 border-green-100';
      case 'JOB_REJECTED': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'JOB_ASSIGNED': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="px-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Activity Logs</h2>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-1">Full System Audit & Event History</p>
        </div>

        {/* Filters Card */}
        <Card className="p-8 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
          <div className="flex items-center gap-2 mb-6 text-corporate-blue">
            <Filter size={18} />
            <h3 className="text-sm font-black uppercase tracking-widest">Filter Audit Trail</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Personnel</label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue appearance-none"
                >
                  <option value="">All Personnel</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">To Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue"
                />
              </div>
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={() => loadLogs(0)}
                className="flex-1 bg-corporate-blue text-white h-12 rounded-2xl font-black uppercase text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Search size={16} /> Apply
              </button>
              <button
                onClick={() => { setSelectedEmployee(null); setStartDate(''); setEndDate(''); setTimeout(() => loadLogs(0), 100); }}
                className="p-3 bg-slate-100 text-slate-500 h-12 w-12 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="border-slate-100 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {['Timestamp', 'Subject Personnel', 'Action Performed', 'Status Delta', 'Asset Details', 'GPS'].map((header) => (
                    <th key={header} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center"><LoadingSpinner /></td>
                  </tr>
                ) : logs && logs.content.length > 0 ? (
                  logs.content.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-sm uppercase">{log.formattedDate}</div>
                        <div className="text-[10px] font-black text-slate-400 tracking-widest">{log.formattedTime}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                            {log.employeeFullName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm uppercase leading-none mb-1">{log.employeeFullName || 'N/A'}</div>
                            <div className="text-[10px] font-bold text-slate-400 lowercase">{log.employeeEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getActivityBadgeColor(log.activityType)}`}>
                          {log.activityDescription}
                        </span>
                        {log.ticketNumber && (
                          <div className="mt-2 text-[10px] font-black text-corporate-blue">TKT #{log.ticketNumber}</div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {log.oldStatus && log.newStatus ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{log.oldStatus}</span>
                            <ArrowRight size={12} className="text-slate-300" />
                            <span className="text-[10px] font-black text-corporate-blue uppercase">{log.newStatus}</span>
                          </div>
                        ) : <span className="text-slate-200">—</span>}
                      </td>
                      <td className="px-8 py-6">
                        {log.generatorName ? (
                          <div>
                            <div className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{log.generatorName}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{log.generatorLocationName}</div>
                          </div>
                        ) : <span className="text-slate-200">—</span>}
                      </td>
                      <td className="px-8 py-6">
                        {log.latitude && (
                          <a
                            href={log.locationMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-corporate-blue hover:text-white transition-all shadow-sm"
                          >
                            <MapPin size={18} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <History size={48} className="mx-auto text-slate-100 mb-4" />
                      <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No activity records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {logs && logs.totalPages > 1 && (
            <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30">
              <Pagination
                currentPage={currentPage}
                totalPages={logs.totalPages}
                onPageChange={(page) => loadLogs(page)}
              />
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}