'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generatorService, ticketService } from '@/lib/services/admin.service';
import { Generator, GeneratorStatistics, MainTicket, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout'; // FIXED: Added missing import
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { 
  Zap, ArrowLeft, Calendar, BarChart3, 
  CheckCircle2, Clock, Filter, X,
  MapPin, Mail, Phone, MessageSquare, Star
} from 'lucide-react';

export default function AdminGeneratorDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [statistics, setStatistics] = useState<GeneratorStatistics | null>(null);
  const [tickets, setTickets] = useState<PageResponse<MainTicket> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedDate, setSelectedDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  useEffect(() => {
    loadGenerator();
    loadStatistics();
    loadTickets(0);
  }, [id, dateFilterActive, selectedDate]);

  const loadGenerator = async () => {
    try {
      const data = await generatorService.getById(id);
      setGenerator(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await generatorService.getStatistics(id);
      setStatistics(data);
    } catch (error) { console.error(error); }
  };

  const loadTickets = async (page: number) => {
    try {
      let data: PageResponse<MainTicket>;
      if (dateFilterActive && selectedDate) {
        const allTickets = await ticketService.getByDateRange(selectedDate, selectedDate, { page, size: 10 });
        const filteredContent = allTickets.content.filter(ticket => ticket.generator.id === id);
        data = {
          ...allTickets,
          content: filteredContent,
          totalElements: filteredContent.length,
          totalPages: Math.ceil(filteredContent.length / 10),
        };
      } else {
        data = await generatorService.getTickets(id, { page, size: 10 });
      }
      setTickets(data);
      setCurrentPage(page);
    } catch (error) { console.error(error); }
  };

  const handleTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setDateFilterActive(true);
    setCurrentPage(0);
  };

  const handleClearFilter = () => {
    setSelectedDate('');
    setDateFilterActive(false);
    setCurrentPage(0);
    loadTickets(0);
  };

  if (loading) return <LoadingSpinner />;
  if (!generator) return <div className="p-10 text-center font-black uppercase text-slate-400">Asset not found</div>;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/generators')}
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-corporate-blue hover:shadow-md transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{generator.name}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Asset ID: #{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-50 shadow-sm">
             <div className="px-4 py-2 bg-slate-50 rounded-xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Model</p>
                <p className="text-xs font-black text-slate-900">{generator.model}</p>
             </div>
             <div className="px-4 py-2 bg-corporate-blue/5 rounded-xl text-center">
                <p className="text-[9px] font-black text-corporate-blue uppercase leading-none">Capacity</p>
                <p className="text-xs font-black text-corporate-blue">{generator.capacity || 'N/A'}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Asset Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Technical Location
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-black text-slate-900">{generator.locationName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Primary Deployment Site</p>
              </div>

              <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest flex items-center gap-2 pt-2">
                <Phone size={14} /> Contact Registry
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <Mail size={16} className="text-slate-300" /> {generator.ownerEmail || 'No Email'}
                </div>
                {generator.whatsAppNumber && (
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <MessageSquare size={16} className="text-slate-300" /> {generator.whatsAppNumber}
                  </div>
                )}
                {generator.landlineNumber && (
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <Phone size={16} className="text-slate-300" /> {generator.landlineNumber}
                  </div>
                )}
              </div>

              {generator.note && (
                <div className="pt-4 border-t border-slate-50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Note</p>
                   <p className="text-xs font-bold text-slate-500 leading-relaxed bg-yellow-50/50 p-4 rounded-xl italic">"{generator.note}"</p>
                </div>
              )}
            </div>

            {/* Visual Stats */}
            {statistics && (
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex justify-between items-center overflow-hidden relative group">
                  <BarChart3 className="absolute -right-2 -bottom-2 w-24 h-24 text-white/5 rotate-12" />
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Total Tickets</p>
                    <p className="text-4xl font-black">{statistics.totalTickets}</p>
                  </div>
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Zap size={24} className="text-corporate-blue" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-xl font-black text-green-600 flex items-center gap-2">
                      <CheckCircle2 size={18} /> {statistics.completedTickets}
                    </p>
                  </div>
                  <div className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-xl font-black text-yellow-600 flex items-center gap-2">
                      <Clock size={18} /> {statistics.pendingTickets}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Ticket Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Maintenance History</h3>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        if (e.target.value) { setDateFilterActive(true); setCurrentPage(0); }
                      }}
                      className="bg-white border-none rounded-xl py-2 pl-9 pr-4 text-[10px] font-black uppercase text-slate-900 shadow-inner outline-none ring-1 ring-slate-100"
                    />
                  </div>
                  <button onClick={handleTodayFilter} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-corporate-blue transition-all">
                    <Filter size={14} />
                  </button>
                  {dateFilterActive && (
                    <button onClick={handleClearFilter} className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-100 transition-all">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8 space-y-4">
                {tickets && tickets.content.length > 0 ? (
                  tickets.content.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                      className="group bg-white border border-slate-100 p-6 rounded-[2rem] hover:shadow-xl hover:border-corporate-blue/20 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowLeft className="rotate-180 text-corporate-blue" size={20} />
                      </div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest">Ticket #{ticket.ticketNumber}</p>
                          <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{ticket.title}</h4>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-50 pt-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Service Type</p>
                          <p className="text-xs font-bold text-slate-700">{ticket.type}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Priority Weight</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={`${i < ticket.weight ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Scheduled Date</p>
                          <p className="text-xs font-bold text-slate-700">{ticket.scheduledDate}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Target Time</p>
                          <p className="text-xs font-bold text-slate-700">{ticket.scheduledTime}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Maintenance Logs Recorded</p>
                  </div>
                )}

                {tickets && tickets.totalPages > 1 && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={tickets.totalPages}
                      onPageChange={loadTickets}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}