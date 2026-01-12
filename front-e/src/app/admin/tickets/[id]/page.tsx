'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ticketService, approvalService } from '@/lib/services/admin.service';
import { MainTicket, MiniJobCard, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import {
  ArrowLeft,
  Send,
  Mail,
  MessageSquare,
  Calendar,
  Settings,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminTicketDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<MainTicket | null>(null);
  const [miniJobs, setMiniJobs] = useState<PageResponse<MiniJobCard> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Notification state
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    loadTicket();
    loadMiniJobs(0);
  }, [id]);

  const loadTicket = async () => {
    try {
      const data = await ticketService.getById(id);
      setTicket(data);
      setNotificationMessage(`Dear Generator Owner,\n\nUpdate for Ticket: ${data.ticketNumber}\nGenerator: ${data.generator.name}\nStatus: ${data.status}\n\nThank you.`);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMiniJobs = async (page: number) => {
    try {
      const data = await ticketService.getMiniJobs(id, { page, size: 10 });
      setMiniJobs(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading mini job cards:', error);
    }
  };

  const handleApprove = async (miniJobId: number) => {
    if (!confirm('Approve this job card?')) return;
    try {
      await approvalService.approve(miniJobId);
      loadMiniJobs(currentPage);
      loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error approving');
    }
  };

  const handleReject = async (miniJobId: number) => {
    const note = prompt('Enter rejection reason:');
    if (!note) return;
    try {
      await approvalService.reject(miniJobId, note);
      loadMiniJobs(currentPage);
      loadTicket();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error rejecting');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!ticket) return <div className="p-12 text-center font-black uppercase text-slate-400">Ticket not found</div>;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div className="space-y-4">
            <button
              onClick={() => router.push('/admin/tickets')}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-corporate-blue transition-colors"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{ticket.title}</h2>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Reference: #{ticket.ticketNumber}</p>
            </div>
          </div>

          <button
            onClick={() => setShowNotificationForm(!showNotificationForm)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-lg ${showNotificationForm ? 'bg-slate-800 text-white' : 'bg-corporate-blue text-white shadow-blue-200'
              }`}
          >
            <Send size={16} /> {showNotificationForm ? 'Close Messenger' : 'Notify Owner'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Notification Panel */}
            {showNotificationForm && (
              <Card className="p-8 border-none shadow-2xl rounded-[2.5rem] bg-white ring-4 ring-corporate-blue/5">
                <div className="flex items-center gap-3 mb-6 text-corporate-blue">
                  <MessageSquare size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Customer Correspondence</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Destination</p>
                    <p className="text-sm font-bold text-slate-700">{ticket.generator.ownerEmail || 'No Email provided'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Mobile</p>
                    <p className="text-sm font-bold text-slate-700">{ticket.generator.whatsAppNumber || 'No Phone provided'}</p>
                  </div>
                </div>

                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-corporate-blue mb-6"
                  placeholder="Enter dispatch message..."
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="peer sr-only"
                          disabled={!ticket.generator.ownerEmail}
                        />
                        <div className="w-5 h-5 bg-slate-100 border-2 border-slate-200 rounded-md peer-checked:bg-corporate-blue peer-checked:border-corporate-blue transition-all" />
                        <CheckCircle2 size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-all" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-corporate-blue transition-colors">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={sendWhatsApp}
                          onChange={(e) => setSendWhatsApp(e.target.checked)}
                          className="peer sr-only"
                          disabled={!ticket.generator.whatsAppNumber}
                        />
                        <div className="w-5 h-5 bg-slate-100 border-2 border-slate-200 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                        <CheckCircle2 size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-all" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-500 transition-colors">WhatsApp</span>
                    </label>
                  </div>

                  <button
                    onClick={() => { }} // handleSendNotification logic
                    disabled={sendingNotification || (!sendEmail && !sendWhatsApp)}
                    className="px-8 py-3 bg-corporate-blue text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {sendingNotification ? 'Processing...' : 'Dispatch Notification'}
                  </button>
                </div>
              </Card>
            )}

            {/* Job Cards Section */}
            <div className="space-y-6">
              <div className="px-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Field Personnel Activity</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification of labor and site evidence</p>
              </div>

              {miniJobs && miniJobs.content.length > 0 ? (
                miniJobs.content.map((job) => (
                  <Card key={job.id} className="p-8 border-none shadow-xl rounded-[2.5rem] bg-white group overflow-hidden relative">
                    {job.approved && (
                      <div className="absolute top-0 right-0 p-4">
                        <CheckCircle2 size={32} className="text-emerald-100" />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                          {job.employee.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 uppercase leading-none mb-1">{job.employee.fullName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 tracking-widest lowercase">{job.employee.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Evidence Image */}
                      <div className="md:col-span-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <ImageIcon size={14} /> Site Evidence
                        </p>
                        {job.imageUrl ? (
                          <div className="relative group/img cursor-zoom-in">
                            <img
                              src={job.imageUrl}
                              alt="Site work evidence"
                              className="rounded-2xl w-full aspect-square object-cover shadow-lg grayscale group-hover/img:grayscale-0 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-corporate-blue/20 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">View Full Size</span>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                            <ImageIcon size={32} />
                            <span className="text-[10px] font-black uppercase mt-2 tracking-widest">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Work Details */}
                      <div className="md:col-span-2 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Labor Time</p>
                            <p className="text-lg font-black text-slate-800 uppercase italic flex items-center gap-2">
                              <Clock size={16} className="text-corporate-blue" /> {formatMinutes(job.workMinutes)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approval State</p>
                            <p className={`text-lg font-black uppercase italic ${job.approved ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {job.approved ? 'Verified' : 'Pending'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Windows</p>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                              <span className="px-2 py-1 bg-slate-50 rounded-lg">{formatDateTime(job.startTime)}</span>
                              <span className="text-slate-300">→</span>
                              <span className="px-2 py-1 bg-slate-50 rounded-lg">{formatDateTime(job.endTime)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8 pt-6 border-t border-slate-50">
                          {job.status === 'COMPLETED' && !job.approved ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleApprove(job.id)}
                                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 size={16} /> Approve Labor
                              </button>
                              <button
                                onClick={() => handleReject(job.id)}
                                className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          ) : job.approved && (
                            <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-center border border-emerald-100">
                              Personnel Activity Verified by Admin
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-20 text-center bg-white rounded-[2.5rem] border-none shadow-xl">
                  <AlertCircle size={48} className="mx-auto text-slate-100 mb-4" />
                  <p className="font-black text-slate-300 uppercase tracking-widest text-sm">No job cards assigned to this ticket</p>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-8">
            <Card className="border border-slate-200 shadow-xl rounded-[2.5rem] bg-slate-50 text-slate-900 overflow-hidden relative">
              {/* Decorative Technical Grid Background - Lightened for visibility */}
              <div className="absolute inset-0 opacity-[0.15]"
                style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

              <div className="relative z-10 p-8">
                <div className="flex items-center justify-between mb-8">
                  {/* Primary accent changed to a bold Indigo */}
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Technical Audit</h3>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>

                <div className="space-y-8">
                  {/* Asset Details */}
                  <div className="group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Settings size={12} className="text-indigo-500" /> Machine Specs
                    </p>
                    <div className="pl-5 border-l border-slate-200 group-hover:border-indigo-500 transition-colors">
                      <p className="font-black text-sm uppercase leading-tight text-slate-800">{ticket.generator.name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 italic">{ticket.generator.model}</p>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MapPin size={12} className="text-indigo-500" /> Deployment Site
                    </p>
                    <div className="pl-5 border-l border-slate-200 group-hover:border-indigo-500 transition-colors">
                      <p className="font-black text-sm uppercase leading-tight tracking-tight text-slate-800">
                        {ticket.generator.locationName}
                      </p>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Calendar size={12} className="text-indigo-500" /> Ops Window
                    </p>
                    <div className="pl-5 border-l border-slate-200 group-hover:border-indigo-500 transition-colors">
                      <p className="font-black text-sm uppercase tracking-widest text-slate-800">
                        {ticket.scheduledDate} <span className="text-indigo-500 mx-1">@</span> {ticket.scheduledTime}
                      </p>
                    </div>
                  </div>

                  {/* Complexity Weight (Stars) */}
                  <div className="group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertCircle size={12} className="text-indigo-500" /> Complexity Weight
                    </p>
                    <div className="pl-5 border-l border-slate-200 group-hover:border-indigo-500 transition-colors">
                      <div className="flex gap-1.5 items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < ticket.weight ? 'text-amber-500' : 'text-slate-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.175 0l-3.388 2.46c-.784.57-1.838-.197-1.539-1.118l1.286-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-[10px] font-black text-slate-400">LVL {ticket.weight}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Internal Briefing Section - Adjusted for light background */}
                <div className="mt-12 p-5 bg-white rounded-3xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Briefing</p>
                  <p className="text-xs italic font-medium text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                    "{ticket.description || 'No specific instructions provided for this maintenance cycle.'}"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {miniJobs && miniJobs.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={miniJobs.totalPages}
              onPageChange={loadMiniJobs}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}