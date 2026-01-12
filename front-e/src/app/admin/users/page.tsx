'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/lib/services/admin.service';
import { User, UserRequest, PageResponse, UserRole } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';
import { 
  Plus, Search, Pencil, Trash2, ShieldCheck, Mail, Phone, X, 
  User as UserIcon, CheckCircle2, AlertCircle, Contact2, Fingerprint 
} from 'lucide-react';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PageResponse<User> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserRequest>({
    username: '', password: '', fullName: '', role: UserRole.EMPLOYEE, phone: '', email: '', active: true,
  });

  useEffect(() => { loadUsers(0); }, []);

  const loadUsers = async (page: number, query = '') => {
    try {
      const data = query ? await userService.search(query, { page, size: 10 }) : await userService.getAll({ page, size: 10 });
      setUsers(data);
      setCurrentPage(page);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', fullName: '', role: UserRole.EMPLOYEE, phone: '', email: '', active: true });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      username: user.username, 
      password: '', 
      fullName: user.fullName, 
      role: user.role, 
      phone: user.phone || '', 
      email: user.email || '', 
      active: user.active 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      editingUser ? await userService.update(editingUser.id, formData) : await userService.create(formData);
      setShowModal(false);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error saving user'); }
  };

  const toggleActive = async (id: number, active: boolean) => {
    try {
      active ? await userService.deactivate(id) : await userService.activate(id);
      loadUsers(currentPage, searchQuery);
    } catch (error: any) { alert('Error updating status'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personnel <span className="text-corporate-blue">Registry</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Manage System Access Controls</p>
          </div>
          <button 
            onClick={handleCreate} 
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-corporate-blue text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg"
          >
            <Plus size={18} /> Register Personnel
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filter by name, username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-corporate-blue/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadUsers(0, searchQuery)} className="bg-corporate-blue text-white px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">Search</button>
            <button onClick={() => { setSearchQuery(''); loadUsers(0); }} className="bg-slate-100 text-slate-500 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">Reset</button>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee Profile</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Designation</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Channels</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users?.content.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-corporate-blue group-hover:text-white transition-all shadow-inner">
                          {u.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{u.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400 italic">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-corporate-blue border border-blue-100'
                      }`}>
                        {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Mail size={12} className="text-slate-300" /> {u.email || '--'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <Phone size={12} className="text-slate-300" /> {u.phone || '--'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleActive(u.id, u.active)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                          u.active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {u.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(u)} className="p-2.5 text-slate-400 hover:text-corporate-blue hover:bg-blue-50 rounded-xl transition-all">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => {}} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-50">
            {users && <Pagination currentPage={currentPage} totalPages={users.totalPages} onPageChange={(p) => loadUsers(p, searchQuery)} />}
          </div>
        </div>
      </div>

      {/* Registry Modal - FULL EDITING SUPPORT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {editingUser ? <Pencil size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{editingUser ? 'Update Profile' : 'New Personnel'}</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] italic">System Registry Entry</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Profile Identity Section */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint size={14} /> Identity & Credentials
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Full Legal Name</label>
                    <input required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">System Username</label>
                    <input disabled={!!editingUser} required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none disabled:opacity-50" placeholder="j.doe" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Access Level</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none appearance-none cursor-pointer">
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">System Password</label>
                      <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Channels Section - NEW & EDITABLE */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black text-corporate-blue uppercase tracking-widest flex items-center gap-2">
                  <Contact2 size={14} /> Communication Channels
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Corporate Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="email@company.com" />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="+94 ..." />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg text-corporate-blue focus:ring-corporate-blue border-slate-300 transition-all"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Access Authorization</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Status: {formData.active ? 'Authenticated' : 'Locked'}</p>
                  </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl hover:bg-corporate-blue transition-all active:scale-95 mt-4">
                Commit to System Registry
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}