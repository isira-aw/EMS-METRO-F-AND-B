'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { MiniJobCard, PageResponse, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import { Calendar, Star, CheckCircle, Clock, ChevronRight, Filter, LayoutGrid } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeJobCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);

  const getTodayDate = () => {
    // Get current date in Sri Lanka timezone (Asia/Colombo, UTC+5:30)
    const sriLankaDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // Convert from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = sriLankaDate.split('/');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  useEffect(() => {
    loadJobCards(0);
    loadPendingCount();
  }, [statusFilter, selectedDate]);

  const loadJobCards = async (page: number) => {
    try {
      setLoading(true);
      const statusToUse = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await jobCardService.getByDate(selectedDate, statusToUse, { page, size: 12 });
      setJobCards(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    setSelectedDate(getTodayDate());
    setCurrentPage(0);
  };

  const loadPendingCount = async () => {
    try {
      const count = await jobCardService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">MY JOB CARDS</h2>
              <p className="text-sm text-slate-500 font-medium">Manage and track your assigned maintenance tasks</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <LayoutGrid size={18} className="text-corporate-blue" />
              <span className="text-sm font-bold text-slate-700">{jobCards?.totalElements || 0} Tasks Found</span>
            </div>
          </div>

          {/* Filter Bar: Adapts from Stacked (Mobile) to Inline (Desktop) */}
          <Card className="mb-8 border-none shadow-sm bg-white overflow-visible">
            <div className="p-4 md:p-6 space-y-6 md:space-y-0 md:flex md:items-end md:gap-6">
              
              {/* Date Selection */}
              <div className="flex-1 space-y-2">
                <label className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Target Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }}
                    className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-corporate-blue outline-none transition-all"
                  />
                  <button 
                    onClick={handleTodayFilter}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-colors active:scale-95"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Status Filter: Dropdown on Mobile, Row on Desktop */}
              <div className="flex-[2] space-y-2">
                <label className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Work Status</label>
                
                {/* Mobile Dropdown (Visible < 768px) */}
                <div className="md:hidden relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="PENDING">PENDING</option>
                    <option value="TRAVELING">TRAVELING</option>
                    <option value="STARTED">STARTED</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Desktop Tabs (Visible > 768px) */}
                <div className="hidden md:flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
                        statusFilter === status 
                        ? 'bg-corporate-blue border-corporate-blue text-white shadow-md' 
                        : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Date Badge (Desktop Only) */}
              <div className="hidden lg:block pb-1">
                <div className="bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Selected</p>
                  <p className="text-sm font-black text-slate-700">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Job Grid: 1 col on Mobile, 2 on Tablet, 3 on Desktop */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="mt-4 text-xs font-black text-slate-400 animate-pulse tracking-tighter">SYNCHRONIZING DATA...</p>
            </div>
          ) : jobCards && jobCards.content.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobCards.content.map((card) => (
                  <div 
                    key={card.id}
                    onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                    className="group bg-white border-2 border-slate-200 rounded-3xl overflow-hidden hover:border-corporate-blue hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer flex flex-col"
                  >
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200">
                          #{card.mainTicket.ticketNumber}
                        </span>
                        <StatusBadge status={card.status} />
                      </div>

                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-6 group-hover:text-corporate-blue transition-colors line-clamp-2">
                        {card.mainTicket.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Duration</p>
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock size={16} className="text-corporate-blue" />
                            <span className="text-sm font-black">{formatMinutes(card.workMinutes)}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Complexity</p>
                          <div className="flex justify-end gap-0.5">
                            {[...Array(card.mainTicket.weight)].map((_, i) => (
                              <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`px-5 py-4 flex items-center justify-between ${card.approved ? 'bg-green-50/50' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${card.approved ? 'bg-green-500' : 'bg-orange-400 animate-pulse'}`}></div>
                        <span className={`text-[11px] font-black uppercase ${card.approved ? 'text-green-700' : 'text-slate-500'}`}>
                          {card.approved ? 'Verified by Admin' : 'Pending Verification'}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-corporate-blue group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={jobCards.totalPages}
                  onPageChange={loadJobCards}
                />
              </div>
            </>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] py-20 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Calendar size={40} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-900">NO TASKS FOUND</h3>
              <p className="text-slate-400 max-w-xs mt-2 font-medium">There are no job cards assigned to you for the selected date.</p>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}