'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jobCardService } from '@/lib/services/employee.service';
import { MiniJobCard, JobStatusLog, JobStatus } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDateTime, formatMinutes } from '@/lib/utils/format';
import { 
  Star, CheckCircle, Clock, MapPin, AlertTriangle, ChevronLeft, Camera, Shield, 
  Info, ExternalLink, Calendar, User, Wrench, Phone, Mail, Zap, FileText, 
  Timer, PlayCircle, StopCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';

// Reusable Components
const CollapsibleSection = ({ title, icon: Icon, isOpen, onToggle, children }: any) => (
  <div className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
    <button onClick={onToggle} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
        <Icon size={18} className="text-corporate-blue" /> {title}
      </h3>
      {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
    </button>
    {isOpen && <div className="px-6 pb-6">{children}</div>}
  </div>
);

const InfoCard = ({ label, value, icon: Icon, bgColor = "bg-slate-50" }: any) => (
  <div className={`${bgColor} rounded-2xl p-4`}>
    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-2">
      {Icon && <Icon size={12} />} {label}
    </p>
    <p className="text-sm font-bold text-slate-700">{value}</p>
  </div>
);

const ContactInfo = ({ icon: Icon, label, value, color = "text-corporate-blue" }: any) => (
  <div className="flex items-center gap-2 bg-white rounded-xl p-3">
    <Icon size={14} className={color} />
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-bold text-slate-700">{value}</p>
    </div>
  </div>
);

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
  const [sections, setSections] = useState({ equipment: false, workSession: false, timeline: false });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [cardData, logsData] = await Promise.all([
        jobCardService.getById(id),
        jobCardService.getLogs(id)
      ]);
      setJobCard(cardData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => reject(new Error('Location permission denied. Please enable GPS.')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const updateStatus = async (newStatus: JobStatus) => {
    setGettingLocation(true);
    try {
      const loc = await getCurrentLocation();
      await jobCardService.updateStatus(id, { newStatus, latitude: loc.latitude, longitude: loc.longitude });
      loadData();
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
      loadData();
    } finally {
      setUploading(false);
    }
  };

  const canUpdateStatus = (status: JobStatus) => {
    const transitions: Record<string, string[]> = {
      PENDING: ['TRAVELING', 'CANCEL'],
      TRAVELING: ['STARTED', 'CANCEL'],
      STARTED: ['COMPLETED', 'ON_HOLD', 'CANCEL'],
      ON_HOLD: ['STARTED'],
      COMPLETED: [],
      CANCEL: []
    };
    return transitions[jobCard!.status]?.includes(status) || false;
  };

  const calculateDuration = () => {
    if (!jobCard?.startTime || !jobCard?.endTime) return null;
    const diffMs = new Date(jobCard.endTime).getTime() - new Date(jobCard.startTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>;
  if (!jobCard) return <div className="p-10 text-center font-black">JOB NOT FOUND</div>;

  const { mainTicket, employee } = jobCard;
  const { generator } = mainTicket;
  const duration = calculateDuration();

  return (
    <EmployeeLayout>
      <div className="max-w-[400px] md:max-w-7xl mx-auto px-4 py-4 space-y-6 overflow-x-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/employee/job-cards')} className="flex items-center gap-1 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-corporate-blue transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
            <StatusBadge status={jobCard.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ticket Header */}
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest mb-1">Ticket #{mainTicket.ticketNumber}</p>
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">{mainTicket.title}</h1>
                </div>
                <div className="bg-slate-100 px-3 py-1.5 rounded-xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase">Type</p>
                  <p className="text-xs font-black text-slate-900">{mainTicket.type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <InfoCard label="Complexity" value={<div className="flex gap-0.5">{[...Array(mainTicket.weight)].map((_, i) => <Star key={i} size={14} className="text-yellow-500 fill-yellow-500" />)}</div>} />
                <InfoCard label="Allocated" value={formatMinutes(jobCard.workMinutes)} icon={Clock} />
                <InfoCard label="Scheduled" value={new Date(mainTicket.scheduledDate).toLocaleDateString()} icon={Calendar} />
                <InfoCard label="Time" value={mainTicket.scheduledTime} icon={Timer} />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <Info size={16} className="text-slate-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Description</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{mainTicket.description || 'No description provided.'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User size={16} className="text-slate-400 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Created By</p>
                    <p className="text-sm font-bold text-slate-700">{mainTicket.createdBy}</p>
                    <p className="text-[11px] text-slate-500">{formatDateTime(mainTicket.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

{/* Status Controls */}
            {jobCard.status !== 'COMPLETED' && jobCard.status !== 'CANCEL' && (
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-corporate-blue p-2 rounded-lg"><Shield size={20} /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Workflow Control</h3>
                    <p className="text-[10px] text-slate-400">Updates require GPS verification</p>
                  </div>
                </div>
                {gettingLocation && (
                  <div className="mb-4 bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <MapPin size={16} className="text-corporate-blue" />
                    <span className="text-xs font-bold uppercase">Acquiring Satellites...</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['TRAVELING', 'STARTED', 'ON_HOLD', 'COMPLETED', 'CANCEL']).map((status) => 
                    canUpdateStatus(status as JobStatus) && (
                      <button key={status} onClick={() => updateStatus(status as JobStatus)} disabled={gettingLocation}
                        className={`py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${status === 'CANCEL' ? 'bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-white text-slate-900 hover:bg-corporate-blue hover:text-white'} disabled:opacity-20`}>
                        {status.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
                <p className="mt-6 text-[9px] text-slate-500 text-center font-bold uppercase flex items-center justify-center gap-2">
                  <AlertTriangle size={12} /> Encrypted GPS logging active
                </p>
              </div>
            )}

            {/* Image Upload */}
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Camera size={18} className="text-corporate-blue" /> Job Evidence
              </h3>
              {jobCard.imageUrl && (
                <div className="mb-6 group relative rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner">
                  <img src={jobCard.imageUrl} alt="Evidence" className="w-full object-cover max-h-[300px]" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black uppercase">Current Image</span>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <Camera size={24} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase">{selectedFile ? selectedFile.name : 'Tap to Upload Photo'}</p>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                </label>
                {selectedFile && (
                  <button onClick={handleImageUpload} disabled={uploading} className="w-full bg-corporate-blue text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">
                    {uploading ? 'Processing...' : 'Submit Evidence'}
                  </button>
                )}
              </div>
            </div>

            {/* Approval Status */}
            <div className={`p-6 rounded-[2rem] border-2 flex items-center gap-4 ${jobCard.approved ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className={`p-3 rounded-2xl ${jobCard.approved ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Verification</p>
                <p className={`text-sm font-black uppercase ${jobCard.approved ? 'text-green-700' : 'text-orange-700'}`}>
                  {jobCard.approved ? 'Approved' : 'Pending Review'}
                </p>
              </div>
            </div>

            {/* Equipment Section */}
            <CollapsibleSection title="Generate Information" icon={Wrench} isOpen={sections.equipment} onToggle={() => setSections({...sections, equipment: !sections.equipment})}>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Zap size={12} /> Generator Name</p>
                      <p className="text-base font-black text-slate-900">{generator.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Model</p>
                      <p className="text-base font-bold text-slate-700">{generator.model}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Capacity</p>
                    <p className="text-sm font-bold text-slate-700">{generator.capacity}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-2"><MapPin size={12} /> Location</p>
                  <p className="text-base font-black text-slate-900 mb-3">{generator.locationName}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ContactInfo icon={Phone} label="Landline" value={generator.landlineNumber} />
                    <ContactInfo icon={Phone} label="WhatsApp" value={generator.whatsAppNumber} color="text-green-600" />
                  </div>
                  
                  {generator.ownerEmail && <ContactInfo icon={Mail} label="Owner Email" value={generator.ownerEmail} />}
                  {generator.note && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-[8px] font-black text-yellow-700 uppercase mb-1">Site Notes</p>
                      <p className="text-xs text-yellow-900">{generator.note}</p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleSection>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <CollapsibleSection title="Activity Timeline" icon={Clock} isOpen={sections.timeline} onToggle={() => setSections({...sections, timeline: !sections.timeline})}>
              <div className="space-y-6">
                {logs.length > 0 ? logs.map((log) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-corporate-blue rounded-full"></div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900 uppercase">{log.newStatus}</p>
                        <span className="text-[9px] font-bold text-slate-400">{formatDateTime(log.loggedAt)}</span>
                      </div>
                      {log.latitude && (
                        <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-corporate-blue hover:underline">
                          <MapPin size={10} /> Verified Location <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase">Waiting for first update</p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            
            {/* Work Session Section */}
            <CollapsibleSection title="Work Session Details" icon={FileText} isOpen={sections.workSession} onToggle={() => setSections({...sections, workSession: !sections.workSession})}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard label="Assigned Technician" value={employee.username} icon={User} />
                <InfoCard label="Job Card Created" value={formatDateTime(jobCard.createdAt)} icon={Calendar} />
                {jobCard.startTime && <InfoCard label="Work Started" value={formatDateTime(jobCard.startTime)} icon={PlayCircle} bgColor="bg-green-50 border border-green-200" />}
                {jobCard.endTime && <InfoCard label="Work Completed" value={formatDateTime(jobCard.endTime)} icon={StopCircle} bgColor="bg-blue-50 border border-blue-200" />}
              </div>
              {duration && (
                <div className="mt-4 bg-corporate-blue text-white rounded-2xl p-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">Actual Duration</p>
                  <p className="text-2xl font-black">{duration}</p>
                  <p className="text-[10px] mt-1 opacity-75">vs {formatMinutes(jobCard.workMinutes)} allocated</p>
                </div>
              )}
            </CollapsibleSection>

            {/* Job Card ID */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Job Card ID</p>
              <p className="text-lg font-black text-slate-900">#{jobCard.id}</p>
            </div>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
}