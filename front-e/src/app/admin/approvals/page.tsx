'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvalService } from '@/lib/services/admin.service';
import { MiniJobCard, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { getTodayInTimezone } from '@/lib/config/timezone';
import { Check, X, Star, Eye, Layers, User as UserIcon, Clock, Hash, Calendar } from 'lucide-react';

export default function AdminApprovals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayInTimezone());

  useEffect(() => {
    loadPending(0);
  }, [selectedDate]);

  const loadPending = async (page: number) => {
    try {
      setLoading(true);
      const data = await approvalService.getPending({ page: 0, size: 1000 });

      // Filter by selected date based on start time
      const filteredContent = data.content.filter((card) => {
        if (!card.startTime) return false;
        const cardDate = new Date(card.startTime).toISOString().split('T')[0];
        return cardDate === selectedDate;
      });

      // Paginate filtered results
      const pageSize = 10;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedContent = filteredContent.slice(startIndex, endIndex);

      setPending({
        content: paginatedContent,
        pageable: {
          pageNumber: page,
          pageSize: pageSize,
          offset: page * pageSize,
          paged: true,
          unpaged: false,
        },
        totalPages: Math.ceil(filteredContent.length / pageSize),
        totalElements: filteredContent.length,
        last: page >= Math.ceil(filteredContent.length / pageSize) - 1,
        first: page === 0,
        size: pageSize,
        number: page,
        numberOfElements: paginatedContent.length,
        empty: paginatedContent.length === 0,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodayFilter = () => {
    setSelectedDate(getTodayInTimezone());
    setCurrentPage(0);
  };

  const handleApprove = async (id: number) => {
    try {
      await approvalService.approve(id);
      alert('Job card approved!');
      loadPending(currentPage);
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving');
    }
  };

  const handleReject = async (id: number) => {
    const note = prompt('Enter rejection reason:');
    if (!note) return;
    try {
      await approvalService.reject(id, note);
      alert('Job card rejected!');
      loadPending(currentPage);
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Approve ${selectedIds.length} selected job cards?`)) return;
    try {
      await approvalService.bulkApprove(selectedIds);
      alert(`${selectedIds.length} job cards approved!`);
      setSelectedIds([]);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error bulk approving');
    }
  };

  const handleAssignScore = async (card: MiniJobCard) => {
    if (!card.approved) {
      alert('Please approve the job card first before assigning a score.');
      return;
    }
    if (!confirm(`Assign score (weight: ${card.mainTicket.weight}) to this job card?`)) return;

    try {
      await approvalService.addScore({ miniJobCardId: card.id });
      alert(`Score of ${card.mainTicket.weight} assigned successfully!`);
      loadPending(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error adding score');
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (loading && !pending) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Approvals Queue</h2>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic mt-1">Review and Score Technician Job Cards</p>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="flex items-center gap-3 bg-corporate-blue text-white px-8 py-4 rounded-2xl font-black uppercase text-sm hover:bg-slate-900 transition-all shadow-xl hover:-translate-y-1"
            >
              <Check size={20} strokeWidth={3} />
              Bulk Approve ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Date Filter */}
        <Card className="p-6 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={16} className="text-corporate-blue" /> Filter by Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(0); }}
                  className="flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue"
                />
                <button
                  onClick={handleTodayFilter}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-corporate-blue transition-colors active:scale-95 whitespace-nowrap"
                >
                  Today
                </button>
              </div>
            </div>
            <div className="bg-slate-100 px-6 py-3 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Results</p>
              <p className="text-lg font-black text-slate-700">{pending?.totalElements || 0}</p>
            </div>
          </div>
        </Card>

        {/* Pending Cards List */}
        <div className="space-y-6">
          {pending && pending.content.length > 0 ? (
            pending.content.map((card) => (
              <div 
                key={card.id} 
                className={`bg-white border-2 rounded-[2.5rem] p-8 transition-all group ${
                  selectedIds.includes(card.id) ? 'border-corporate-blue shadow-2xl' : 'border-slate-100 shadow-md hover:shadow-xl'
                }`}
              >
                <div className="flex items-start gap-6">
                  {/* Selection Checkbox */}
                  <div className="pt-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(card.id)}
                      onChange={() => toggleSelection(card.id)}
                      className="w-6 h-6 rounded-lg border-2 border-slate-300 text-corporate-blue focus:ring-corporate-blue cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 space-y-6">
                    {/* Header Info */}
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-corporate-blue uppercase tracking-tighter bg-corporate-blue/10 px-3 py-1 rounded-lg flex items-center gap-1">
                            <Hash size={12} /> {card.mainTicket.ticketNumber}
                          </span>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.mainTicket.type}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight group-hover:text-corporate-blue transition-colors">
                          {card.mainTicket.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2 text-slate-600">
                            <UserIcon size={16} className="text-corporate-blue" />
                            <span className="text-sm font-black uppercase tracking-tight">{card.employee.fullName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                className={`${i < card.mainTicket.weight ? 'text-yellow-500 fill-yellow-500' : 'text-slate-200'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="scale-110">
                        <StatusBadge status={card.status} />
                      </div>
                    </div>

                    {/* Image Review Section */}
                    {card.imageUrl && (
                      <div className="relative group/img overflow-hidden rounded-3xl border-4 border-slate-50 w-fit">
                        <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full z-10 backdrop-blur-sm">
                          Review Attachment
                        </div>
                        <img
                          src={card.imageUrl}
                          alt="Job review"
                          className="object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          style={{ maxHeight: '240px', width: 'auto', minWidth: '320px' }}
                        />
                      </div>
                    )}

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={12} /> Work Duration
                        </span>
                        <span className="text-sm font-black text-slate-800">{formatMinutes(card.workMinutes)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Layers size={12} /> Approved State
                        </span>
                        <span className={`text-sm font-black uppercase ${card.approved ? 'text-green-600' : 'text-red-500'}`}>
                          {card.approved ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</span>
                        <span className="text-[11px] font-bold text-slate-700">{card.startTime ? formatDateTime(card.startTime) : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</span>
                        <span className="text-[11px] font-bold text-slate-700">{card.endTime ? formatDateTime(card.endTime) : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button 
                        onClick={() => handleApprove(card.id)} 
                        disabled={card.approved}
                        className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                          card.approved ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                        }`}
                      >
                        <Check size={18} strokeWidth={3} /> Approve
                      </button>

                      <button 
                        onClick={() => handleReject(card.id)} 
                        className="flex-1 md:flex-none px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center gap-2"
                      >
                        <X size={18} strokeWidth={3} /> Reject
                      </button>

                      <button 
                        onClick={() => handleAssignScore(card)} 
                        className={`flex-1 md:flex-none px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all border-2 ${
                          card.approved 
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-500 hover:text-white' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Star size={18} className={card.approved ? 'fill-current' : ''} />
                        Assign Score ({card.mainTicket.weight})
                      </button>

                      <button 
                        onClick={() => router.push(`/employee/job-cards/${card.id}`)} 
                        className="flex-1 md:flex-none px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-corporate-blue transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Eye size={18} /> View Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] py-32 text-center">
               <Layers size={60} className="mx-auto text-slate-200 mb-6" />
               <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">All Job Cards Have Been Processed</p>
            </div>
          )}
        </div>

        {pending && (
          <div className="mt-8">
            <Pagination 
              currentPage={currentPage} 
              totalPages={pending.totalPages} 
              onPageChange={loadPending} 
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}