'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employeeDashboardService, attendanceService, jobCardService } from '@/lib/services/employee.service';
import { EmployeeDashboardResponse } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import { Play, Square, CheckCircle, Clock, ChevronRight, Zap, TrendingUp, Briefcase, ClipboardList } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function initDashboard() {
      try {
        // 1. Fetch the specific pending count as requested
        const count = await jobCardService.getPendingCount();
        setPendingCount(count);

        // 2. Fetching other dashboard data for stats
        const data = await employeeDashboardService.getSummary();
        setDashboard(data);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, []);

  const handleStartDay = async () => {
    try {
      await attendanceService.startDay();
      const data = await employeeDashboardService.getSummary();
      setDashboard(data);
    } catch (error) {
      console.error('Error starting day:', error);
    }
  };

  const handleEndDay = async () => {
    try {
      await attendanceService.endDay();
      const data = await employeeDashboardService.getSummary();
      setDashboard(data);
    } catch (error) {
      console.error('Error ending day:', error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="max-w-[400px] md:max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">MY DASHBOARD</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Real-time Performance & Operations</p>
          </div>
        </div>

        {/* 2. Attendance Action Card */}
        <div className={`relative overflow-hidden rounded-[2.5rem] p-6 md:p-8 transition-all border-2 ${
          dashboard?.dayStarted && !dashboard?.dayEnded 
          ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-blue-900/20' 
          : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={18} className={dashboard?.dayStarted && !dashboard?.dayEnded ? 'text-corporate-blue' : 'text-slate-300'} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Shift Status</h3>
              </div>
              <p className={`text-2xl md:text-3xl font-black ${dashboard?.dayStarted && !dashboard?.dayEnded ? 'text-white' : 'text-slate-900'}`}>
                {dashboard?.currentStatus === 'PRESENT' ? 'Currently On Duty' : dashboard?.currentStatus || 'Not Started'}
              </p>
            </div>

            <div className="flex gap-3">
              {!dashboard?.dayStarted ? (
                <button onClick={handleStartDay} className="flex-1 md:flex-none bg-corporate-blue hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                  <Play size={18} fill="currentColor" /> Start Work Day
                </button>
              ) : !dashboard?.dayEnded ? (
                <button onClick={handleEndDay} className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Square size={18} fill="currentColor" /> End Work Day
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-4 rounded-2xl flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Shift Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
                {/* 1. BIG JOB CARDS BUTTON */}
        <button 
          onClick={() => router.push('/employee/job-cards')}
          className="w-full group relative overflow-hidden bg-corporate-blue p-8 rounded-[2.5rem] shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between text-white"
        >
          <div className="relative z-10 flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <ClipboardList size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black leading-tight">JOB CARDS</h3>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">
                {pendingCount} Tasks Pending
              </p>
            </div>
          </div>
          <ChevronRight size={30} className="relative z-10 opacity-50 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        </button>

      </div>
    </EmployeeLayout>
  );
}