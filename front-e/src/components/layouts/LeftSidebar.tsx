'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import { LucideIcon } from 'lucide-react'; // Import the built-in type
import {
  LayoutDashboard,
  Users,
  Zap,
  Ticket,
  CheckCircle2,
  FileText,
  ScrollText,
  ClipboardList,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User as UserIcon,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon; // Use Lucide's official type instead of custom ComponentType
  badge?: number;
}

interface LeftSidebarProps {
  role: 'ADMIN' | 'EMPLOYEE';
  user: any;
  pendingJobsCount?: number;
}

export default function LeftSidebar({ role, user, pendingJobsCount }: LeftSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Generators', path: '/admin/generators', icon: Zap },
    { name: 'Tickets', path: '/admin/tickets', icon: Ticket },
    { name: 'Approvals', path: '/admin/approvals', icon: CheckCircle2 },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Logs', path: '/admin/logs', icon: ScrollText },
  ];

  const employeeNavItems: NavItem[] = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'Job Cards', path: '/employee/job-cards', icon: ClipboardList, badge: pendingJobsCount },
    { name: 'Attendance', path: '/employee/attendance', icon: UserCheck },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : employeeNavItems;

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const handleLogout = () => authService.logout();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile Menu Button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-900 text-white rounded-2xl shadow-xl"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 text-white z-50 transition-all duration-300 ease-in-out border-r border-white/5
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 ${isCollapsed ? 'lg:w-24' : 'lg:w-72'} w-72
        `}
      >
        {/* Brand Header */}
        <div className="h-24 flex items-center justify-between px-6">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <div className="w-10 h-10 bg-corporate-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={22} className="text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase">EMS <span className="text-corporate-blue">Portal</span></h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role}</p>
            </div>
          </div>

          <button
            onClick={() => (isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed))}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
          >
            {isMobileOpen ? <X size={20} /> : <ChevronLeft size={20} className={isCollapsed ? 'rotate-180' : ''} />}
          </button>
        </div>

        {/* User Quick Profile */}
        <div className={`px-4 mb-6 ${isCollapsed ? 'lg:px-4' : ''}`}>
          <div className={`bg-white/5 border border-white/5 rounded-[2rem] p-4 flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-corporate-blue/20 border border-corporate-blue/30 flex items-center justify-center text-corporate-blue flex-shrink-0">
              <UserIcon size={20} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-black truncate">{user?.fullName || 'Operator'}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">System Verified</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`
                  w-full group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all relative
                  ${active 
                    ? 'bg-corporate-blue text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                `}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                
                {!isCollapsed && (
                  <span className="text-xs font-black uppercase tracking-widest">{item.name}</span>
                )}

                {active && !isCollapsed && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 mt-auto">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all
              ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
            `}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}