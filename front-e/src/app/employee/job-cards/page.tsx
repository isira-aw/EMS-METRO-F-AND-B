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
import { Calendar, Star, Clock, ChevronRight, Filter, LayoutGrid, Hash } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function EmployeeJobCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');
  const [pendingCount, setPendingCount] = useState(0);

  const getTodayDate = () => {
    const sriLankaDate = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
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
      if (data && data.content) {
        data.content.sort((a, b) => a.mainTicket.scheduledTime.localeCompare(b.mainTicket.scheduledTime));
      }
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

  const getPriority = (index: number) => {
    const isTopThree = index < 3;
    return {
      label: `${index + 1}${index === 0 ? 'ST' : index === 1 ? 'ND' : index === 2 ? 'RD' : 'TH'} PRIORITY`,
      color: isTopThree ? 'text-corporate-blue' : 'text-slate-500',
      bgColor: isTopThree ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100',
    };
  };

  return (
    <EmployeeLayout pendingJobsCount={pendingCount}>
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">MY JOB CARDS</h2>
              <p className="text-sm text-slate-500 font-medium">Assigned maintenance tasks</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 w-fit">
              <LayoutGrid size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-600 uppercase">{jobCards?.totalElements || 0} Tasks</span>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 border border-slate-200 shadow-sm bg-white">
            <div className="p-5 flex flex-col md:flex-row md:items-end gap-6">

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                  <button onClick={handleTodayFilter} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-black uppercase hover:bg-slate-800 transition-all">
                    Today
                  </button>
                </div>
              </div>

              <div className="flex-[2] space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Status</label>
                <div className="md:hidden relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-slate-800 outline-none"
                  >
                    {['ALL', 'PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'].map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="hidden md:flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-black border transition-all ${statusFilter === status
                          ? 'bg-corporate-blue border-corporate-blue text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Job Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingSpinner />
              <p className="mt-4 text-xs font-black text-slate-400 tracking-widest uppercase">Syncing</p>
            </div>
          ) : jobCards && jobCards.content.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {jobCards.content.map((card, index) => {
                  const priority = getPriority(index);
                  return (
                    <div
                      key={card.id}
                      onClick={() => router.push(`/employee/job-cards/${card.id}`)}
                      className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-corporate-blue hover:shadow-md transition-all cursor-pointer flex flex-col"
                    >
                      <div className={`py-2 border-b text-center text-xs font-black tracking-widest ${priority.bgColor} ${priority.color}`}>
                        {priority.label}
                      </div>

                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                            <Hash size={14} /> {card.mainTicket.ticketNumber}
                          </span>
                          <StatusBadge status={card.status} />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg shrink-0 ${card.mainTicket.type === 'REPAIR'
                              ? 'bg-orange-50 text-orange-600 border border-orange-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                            {card.mainTicket.type}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-corporate-blue transition-colors line-clamp-2">
                            {card.mainTicket.generator.name}
                          </h3>
                        </div>
                        <p className="text-xs font-medium text-slate-400 line-clamp-1">Title : {card.mainTicket.title}</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Calendar size={14} className="text-slate-400" />
                              <span className="text-sm font-black">
                                {new Date(card.mainTicket.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Time</p>
                            <div className="flex items-center gap-2 text-slate-700">
                              <Clock size={14} className="text-slate-400" />
                              <span className="text-sm font-black">{card.mainTicket.scheduledTime.substring(0, 5)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{formatMinutes(card.workMinutes)}</span>
                          </div>
                          <div className="flex gap-0.5"> points : 
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < card.mainTicket.weight ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className={`px-4 py-3 flex items-center justify-between border-t border-slate-50 ${card.approved ? 'bg-green-50/30' : 'bg-white'}`}>
                        <span className={`text-xs font-black uppercase ${card.approved ? 'text-green-600' : 'text-slate-400'}`}>
                          {card.approved ? '✓ Verified' : '○ Admin did not verify yet'}
                        </span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-corporate-blue transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={jobCards.totalPages} onPageChange={loadJobCards} />
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center text-center px-6">
              <Calendar size={48} className="text-slate-100 mb-4" />
              <h3 className="text-lg font-black text-slate-900 uppercase">No Tasks</h3>
              <p className="text-sm text-slate-400 mt-1">No assignments found for this date.</p>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}