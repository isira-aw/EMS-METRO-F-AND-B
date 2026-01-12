'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generatorService } from '@/lib/services/admin.service';
import { Generator, GeneratorRequest, PageResponse } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils/format';
import { 
  Zap, Plus, Search, MapPin, Mail, Phone, 
  MessageSquare, FileText, Info, X, Pencil, Trash2, 
  ChevronRight, Activity
} from 'lucide-react';

export default function AdminGenerators() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generators, setGenerators] = useState<PageResponse<Generator> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGen, setEditingGen] = useState<Generator | null>(null);
  const [formData, setFormData] = useState<GeneratorRequest>({
    model: '', name: '', capacity: '', locationName: '', ownerEmail: '', whatsAppNumber: '', landlineNumber: '', note: '',
  });

  useEffect(() => { loadGenerators(0); }, []);

  const loadGenerators = async (page: number, query = '') => {
    try {
      const data = query ? await generatorService.searchByName(query, { page, size: 10 }) : await generatorService.getAll({ page, size: 10 });
      setGenerators(data);
      setCurrentPage(page);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadGenerators(0, searchQuery);
  };

  const handleCreate = () => {
    setEditingGen(null);
    setFormData({ model: '', name: '', capacity: '', locationName: '', ownerEmail: '', whatsAppNumber: '', landlineNumber: '', note: '' });
    setShowModal(true);
  };

  const handleEdit = (gen: Generator) => {
    setEditingGen(gen);
    setFormData({ model: gen.model, name: gen.name, capacity: gen.capacity || '', locationName: gen.locationName, ownerEmail: gen.ownerEmail || '', whatsAppNumber: gen.whatsAppNumber || '', landlineNumber: gen.landlineNumber || '', note: gen.note || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      editingGen ? await generatorService.update(editingGen.id, formData) : await generatorService.create(formData);
      setShowModal(false);
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error saving generator'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will fail if there are associated tickets.')) return;
    try {
      await generatorService.delete(id);
      loadGenerators(currentPage, searchQuery);
    } catch (error: any) { alert(error.response?.data?.message || 'Error deleting generator'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Asset <span className="text-corporate-blue">Inventory</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Generator Fleet Management</p>
          </div>
          <button 
            onClick={handleCreate} 
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-corporate-blue text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} /> Register Asset
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Filter by machine name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-corporate-blue/20 transition-all outline-none"
            />
          </form>
          <div className="flex gap-2">
            <button onClick={() => loadGenerators(0, searchQuery)} className="bg-corporate-blue text-white px-8 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform">Filter</button>
            <button onClick={() => { setSearchQuery(''); loadGenerators(0); }} className="bg-slate-100 text-slate-500 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">Reset</button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generators && generators.content.length > 0 ? (
            generators.content.map((gen) => (
              <div key={gen.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
                <div className="p-6 pb-0 flex justify-between items-start">
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-600 group-hover:bg-corporate-blue group-hover:text-white transition-colors">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-green-100">
                    <Activity size={12} /> Registered
                  </span>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{gen.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model: {gen.model}</p>
                  </div>

                  <div className="space-y-2.5 border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <MapPin size={14} className="text-slate-300" />
                      <span>{gen.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Info size={14} className="text-slate-300" />
                      <span>Capacity: {gen.capacity || 'N/A'}</span>
                    </div>
                    {gen.ownerEmail && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Mail size={12} className="text-slate-300" />
                        <span className="truncate">{gen.ownerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/50 px-6 py-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => router.push(`/admin/generators/${gen.id}`)}
                      className="text-[10px] font-black text-corporate-blue uppercase tracking-widest flex items-center gap-1 group/btn"
                    >
                      Full Details <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(gen)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(gen.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Zap size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Assets Detected in Registry</p>
            </div>
          )}
        </div>

        {generators && (
          <div className="mt-8">
             <Pagination currentPage={currentPage} totalPages={generators.totalPages} onPageChange={(p) => loadGenerators(p, searchQuery)} />
          </div>
        )}
      </div>

      {/* Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest">{editingGen ? 'Update Asset' : 'New Asset'}</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] italic">Generator Specifications</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Machine Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="e.g. Cummins-01" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Model Number *</label>
                  <input required value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="C44D5" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Capacity</label>
                  <input value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 px-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="44kVA" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Location Name *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input required value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="Main Branch" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Owner Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="email" value={formData.ownerEmail} onChange={(e) => setFormData({...formData, ownerEmail: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="client@example.com" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">WhatsApp</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={formData.whatsAppNumber || ''} onChange={(e) => setFormData({...formData, whatsAppNumber: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" placeholder="+94..." />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Landline</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input value={formData.landlineNumber || ''} onChange={(e) => setFormData({...formData, landlineNumber: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 text-xs">Technical Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-300" size={14} />
                    <textarea value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full bg-slate-50 rounded-xl py-3 pl-10 pr-4 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-corporate-blue/20 min-h-[100px]" placeholder="Specific service requirements..." />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl hover:bg-corporate-blue transition-all active:scale-95 mt-2">
                Commit to Inventory
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}