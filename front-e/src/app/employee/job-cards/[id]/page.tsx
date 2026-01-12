'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { MiniJobCard, JobStatusLog, JobStatus } from '@/types';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { Star, CheckCircle, Clock, MapPin, AlertTriangle, ChevronLeft, Camera, Shield, Info, ExternalLink } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

export default function JobCardDetail() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<MiniJobCard | null>(null);
  const [logs, setLogs] = useState<JobStatusLog[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadJobCard();
    loadLogs();
  }, [id]);

  const loadJobCard = async () => {
    try {
      const data = await jobCardService.getById(id);
      setJobCard(data);
    } catch (error) {
      console.error('Error loading job card:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await jobCardService.getLogs(id);
      setLogs(data);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error('Location permission denied. Please enable GPS.')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const updateStatus = async (newStatus: JobStatus) => {
    setGettingLocation(true);
    try {
      const loc = await getCurrentLocation();
      await jobCardService.updateStatus(id, {
        newStatus,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      loadJobCard();
      loadLogs();
    } catch (error: any) {
      alert(error.message || 'Status update failed');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await jobCardService.uploadImage(id, selectedFile);
      setSelectedFile(null);
      loadJobCard();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!jobCard) return <div className="p-10 text-center font-black">JOB NOT FOUND</div>;

  const canUpdateStatus = (status: JobStatus) => {
    const current = jobCard.status;
    if (current === 'PENDING') return ['TRAVELING', 'CANCEL'].includes(status);
    if (current === 'TRAVELING') return ['STARTED', 'CANCEL'].includes(status);
    if (current === 'STARTED') return ['COMPLETED', 'ON_HOLD', 'CANCEL'].includes(status);
    if (current === 'ON_HOLD') return ['STARTED'].includes(status);
    return false;
  };

  return (
    <EmployeeLayout>
      <div className="max-w-[400px] md:max-w-7xl mx-auto px-4 py-4 space-y-6 overflow-x-hidden">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/employee/job-cards')}
            className="flex items-center gap-1 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-corporate-blue transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
            <StatusBadge status={jobCard.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest mb-1">
                Ticket #{jobCard.mainTicket.ticketNumber}
              </p>
              <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                {jobCard.mainTicket.title}
              </h1>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Work Complexity</p>
                  <div className="flex gap-0.5">
                    {[...Array(jobCard.mainTicket.weight)].map((_, i) => (
                      <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Allocated Time</p>
                  <div className="flex items-center justify-end gap-1.5 font-black text-slate-700">
                    <Clock size={14} className="text-corporate-blue" />
                    <span className="text-xs">{formatMinutes(jobCard.workMinutes)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1"><Info size={16} className="text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Description</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                      {jobCard.mainTicket.description || 'No detailed description provided.'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Equipment</p>
                    <p className="text-sm font-bold text-slate-800">{jobCard.mainTicket.generator.name}</p>
                    <p className="text-[11px] text-slate-500">{jobCard.mainTicket.generator.model}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Location</p>
                    <p className="text-sm font-bold text-slate-800">{jobCard.mainTicket.generator.locationName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update Control Center */}
            {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-corporate-blue p-2 rounded-lg">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Workflow Control</h3>
                    <p className="text-[10px] text-slate-400">Updates require GPS verification</p>
                  </div>
                </div>

                {gettingLocation && (
                  <div className="mb-4 bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <MapPin size={16} className="text-corporate-blue" />
                    <span className="text-xs font-bold uppercase tracking-tighter">Acquiring Satellites...</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL'] as JobStatus[]).map((status) => 
                    canUpdateStatus(status) && (
                      <button
                        key={status}
                        onClick={() => updateStatus(status)}
                        disabled={gettingLocation}
                        className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2
                          ${status === 'CANCEL' 
                            ? 'bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' 
                            : 'bg-white text-slate-900 hover:bg-corporate-blue hover:text-white'} 
                          disabled:opacity-20`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
                
                <p className="mt-6 text-[9px] text-slate-500 text-center font-bold uppercase tracking-tighter flex items-center justify-center gap-2">
                  <AlertTriangle size={12} /> Encrypted GPS logging is active for this session
                </p>
              </div>
            )}

            {/* Image Upload Area */}
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Camera size={18} className="text-corporate-blue" /> Final Job Evidence
              </h3>

              {jobCard.imageUrl && (
                <div className="mb-6 group relative rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner">
                  <img src={jobCard.imageUrl} alt="Review" className="w-full object-cover max-h-[300px]" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black uppercase">Current Image</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera size={24} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                      {selectedFile ? selectedFile.name : 'Tap to Take Photo or Upload'}
                    </p>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                </label>

                {selectedFile && (
                  <button 
                    onClick={handleImageUpload}
                    disabled={uploading}
                    className="w-full bg-corporate-blue text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20"
                  >
                    {uploading ? 'Processing Image...' : 'Submit Evidence'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Activity Log Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Activity Timeline</h3>
              
              <div className="space-y-6">
                {logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-corporate-blue rounded-full"></div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.newStatus}</p>
                          <span className="text-[9px] font-bold text-slate-400">{formatDateTime(log.loggedAt)}</span>
                        </div>
                        
                        {log.latitude && (
                          <a
                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-corporate-blue hover:underline"
                          >
                            <MapPin size={10} /> Verified Location <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase">Waiting for first update</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Badge */}
            <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 ${jobCard.approved ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className={`p-3 rounded-2xl ${jobCard.approved ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Verification</p>
                <p className={`text-sm font-black uppercase ${jobCard.approved ? 'text-green-700' : 'text-orange-700'}`}>
                  {jobCard.approved ? 'Admin Approved' : 'Awaiting Review'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
}