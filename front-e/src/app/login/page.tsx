'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { Zap, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });

      const { accessToken, refreshToken, role, fullName } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      localStorage.setItem('username', username);

      router.push(role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err: any) {
      setError('The credentials you entered are incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-corporate-blue/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[440px] px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-corporate-blue rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-4">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            EMS <span className="text-corporate-blue">Portal</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
            Metropolitan Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900">Sign In</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Enter your system credentials</p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
              <AlertCircle size={18} />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-corporate-blue transition-all outline-none"
                  placeholder="e.g. j.doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-corporate-blue transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pr-1">
              <Link
                href="/forgot-password"
                className="text-[10px] font-black text-slate-400 hover:text-corporate-blue uppercase tracking-widest transition-colors"
              >
                Forgot Access?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-corporate-blue text-white font-black uppercase tracking-[0.15em] py-5 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                'System Login'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            © 2026 Metropolitan EMS
          </p>
        </div>
      </div>
    </div>
  );
}