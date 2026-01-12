'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { attendanceService } from '@/lib/services/employee.service';
import { EmployeeDayAttendance, PageResponse } from '@/types';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatDateTime, formatMinutes } from '@/lib/utils/format';
import { Calendar, Clock, ArrowLeft, ArrowUpRight, Coffee, Moon } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeAttendance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PageResponse<EmployeeDayAttendance> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    loadHistory(0);
  }, []);

  const loadHistory = async (page: number) => {
    try {
      const data = await attendanceService.getHistory({ page, size: 10 });
      setHistory(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;

  return (
    <EmployeeLayout>
      <div className="max-w-[400px] md:max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header Action Area */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Attendance</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Logs & OT Breakdown</p>
          </div>
          <button 
            onClick={() => router.push('/employee/dashboard')}
            className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:text-corporate-blue hover:border-corporate-blue transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 rounded-3xl p-4 text-white">
            <p className="text-[9px] font-black opacity-50 uppercase mb-1">Total Days</p>
            <p className="text-xl font-black">{history?.totalElements || 0}</p>
          </div>
          <div className="bg-corporate-blue rounded-3xl p-4 text-white">
            <p className="text-[9px] font-black opacity-50 uppercase mb-1">Avg. Hours</p>
            <p className="text-xl font-black">8.4h</p>
          </div>
        </div>

        {/* Attendance List/Table Container */}
        <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          
          {/* Desktop Header - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-7 gap-4 px-8 py-6 bg-slate-50 border-b border-slate-100">
            {['Date', 'Shift Start', 'Shift End', 'Work Time', 'Morning OT', 'Evening OT', 'Total OT'].map((h) => (
              <span key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-slate-50">
            {history && history.content.length > 0 ? (
              history.content.map((record) => (
                <div key={record.id} className="group hover:bg-slate-50 transition-colors">
                  
                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-7 gap-4 px-8 py-6 items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                        <Calendar size={14} className="text-slate-500" />
                      </div>
                      <span className="text-sm font-black text-slate-900">{formatDate(record.date)}</span>
                    </div>
                    
                    <span className="text-xs font-bold text-slate-600">{record.dayStartTime ? formatDateTime(record.dayStartTime) : '--:--'}</span>
                    <span className="text-xs font-bold text-slate-600">{record.dayEndTime ? formatDateTime(record.dayEndTime) : '--:--'}</span>
                    
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-corporate-blue" />
                      <span className="text-sm font-black text-slate-900">{formatMinutes(record.totalWorkMinutes)}</span>
                    </div>

                    <span className="text-xs font-bold text-slate-500">{formatMinutes(record.morningOtMinutes)}</span>
                    <span className="text-xs font-bold text-slate-500">{formatMinutes(record.eveningOtMinutes)}</span>
                    
                    <div className="flex items-center gap-1 text-corporate-blue">
                      <ArrowUpRight size={14} />
                      <span className="text-sm font-black uppercase tracking-tighter">
                        {formatMinutes(record.morningOtMinutes + record.eveningOtMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Card - Hidden on Desktop */}
                  <div className="md:hidden p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Calendar size={18} className="text-slate-900" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{formatDate(record.date)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Work Day</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-corporate-blue">{formatMinutes(record.totalWorkMinutes)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Active</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
                        <Clock size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Start</p>
                          <p className="text-[10px] font-bold text-slate-700">{record.dayStartTime ? formatDateTime(record.dayStartTime) : '--:--'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 flex items-center gap-3">
                        <Clock size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">End</p>
                          <p className="text-[10px] font-bold text-slate-700">{record.dayEndTime ? formatDateTime(record.dayEndTime) : '--:--'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Coffee size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{formatMinutes(record.morningOtMinutes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Moon size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{formatMinutes(record.eveningOtMinutes)}</span>
                        </div>
                      </div>
                      <div className="bg-corporate-blue/10 px-3 py-1 rounded-full flex items-center gap-1">
                         <span className="text-[9px] font-black text-corporate-blue uppercase tracking-widest">OT Total: {formatMinutes(record.morningOtMinutes + record.eveningOtMinutes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No Logs Available</p>
              </div>
            )}
          </div>

          {/* Pagination Area */}
          {history && (
            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={history.totalPages}
                onPageChange={loadHistory}
              />
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}