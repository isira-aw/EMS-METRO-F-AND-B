'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportService } from '@/lib/services/admin.service';
import { DashboardStats } from '@/types';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatMinutes } from '@/lib/utils/format';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Users, 
  Zap, 
  Ticket, 
  CheckCircle, 
  BarChart3, 
  ArrowUpRight, 
  Clock, 
  Activity,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await reportService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-corporate-blue uppercase tracking-[0.3em] mb-1">System Overview</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Command <span className="text-corporate-blue">Center</span></h2>
          </div>
          <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
            <Activity size={16} className="text-green-500" />
            <span className="text-xs font-bold uppercase tracking-tight">System Live: 2026-01-10</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Employees', value: stats?.totalEmployees, sub: `Active: ${stats?.activeEmployees}`, icon: Users, color: 'bg-blue-600' },
            { label: 'Generators', value: stats?.totalGenerators, sub: 'Units Online', icon: Zap, color: 'bg-slate-900' },
            { label: 'Total Tickets', value: stats?.totalTickets, sub: `Completed: ${stats?.completedTickets}`, icon: Ticket, color: 'bg-blue-600' },
            { label: 'Pending Approvals', value: stats?.pendingApprovals, sub: 'Requires Action', icon: CheckCircle, color: stats?.pendingApprovals && stats.pendingApprovals > 0 ? 'bg-amber-500' : 'bg-slate-900' },
          ].map((item, i) => (
            <div key={i} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className={`${item.color} p-3 rounded-2xl text-white shadow-lg`}>
                  <item.icon size={20} />
                </div>
                <ArrowUpRight size={20} className="text-slate-300 group-hover:text-corporate-blue transition-colors" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{item.value || 0}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Action Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="md:col-span-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-[-10px]">Operations</h3>
            
            {[
              { title: 'User Registry', desc: 'Personnel & Access Control', path: '/admin/users', icon: Users },
              { title: 'Asset Tracking', desc: 'Generator Inventory', path: '/admin/generators', icon: Zap },
              { title: 'Service Tickets', desc: 'Maintenance Logs', path: '/admin/tickets', icon: Ticket },
              { title: 'Final Approvals', desc: 'Job Card Verification', path: '/admin/approvals', icon: CheckCircle, badge: stats?.pendingApprovals },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => router.push(action.path)}
                className="group flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] hover:bg-corporate-blue transition-all duration-300 text-left overflow-hidden relative shadow-lg"
              >
                <div className="relative z-10">
                  <h4 className="text-white font-black uppercase tracking-tight text-lg leading-tight">{action.title}</h4>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-tighter group-hover:text-white/80">{action.desc}</p>
                </div>
                <div className="relative z-10 bg-white/10 p-2 rounded-xl text-white group-hover:bg-white group-hover:text-corporate-blue transition-all">
                  <ChevronRight size={20} />
                </div>
                {action.badge && action.badge > 0 && (
                  <span className="absolute top-4 right-4 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full border border-slate-900">
                    {action.badge} NEW
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Time Analytics */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency Tracker</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm h-full flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-corporate-blue">
                    <Clock size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Work Time (Month)</span>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {formatMinutes(stats?.totalWorkMinutesThisMonth || 0)}
                  </h4>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-corporate-blue w-[70%]" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                    <Activity size={16} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Overtime (Month)</span>
                  </div>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {formatMinutes(stats?.totalOTMinutesThisMonth || 0)}
                  </h4>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-amber-500 w-[30%]" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => router.push('/admin/reports')}
                className="mt-12 flex items-center justify-center gap-2 w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-corporate-blue transition-all"
              >
                <BarChart3 size={16} />
                View Full Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}