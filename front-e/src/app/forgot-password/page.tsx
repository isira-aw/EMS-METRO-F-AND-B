'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ShieldQuestion } from 'lucide-react';

export default function ForgotPassword() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/password-reset/forgot-password', {
        emailOrPhone,
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setEmailOrPhone('');
        setTimeout(() => {
          router.push('/login');
        }, 4000);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'System recovery failed. Contact Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden">
      {/* Background Brand Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-900" />
      
      <div className="relative w-full max-w-[440px] px-6">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 mb-4">
            <ShieldQuestion size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            Account <span className="text-corporate-blue">Recovery</span>
          </h1>
        </div>

        {/* Recovery Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-slate-100">
          {!message ? (
            <>
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-xl font-black text-slate-900">Forgot Password?</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-1">
                  Enter your credentials to receive a secure link.
                </p>
              </div>

              {error && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                  <AlertCircle size={18} />
                  <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Registered Email or Phone
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-corporate-blue transition-all outline-none"
                      placeholder="name@metropolitan.com"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-corporate-blue text-white font-black uppercase tracking-[0.15em] py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Request Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Check Your Inbox</h2>
              <p className="text-sm font-bold text-slate-500 mb-8">
                {message}
              </p>
              <div className="animate-pulse flex flex-col items-center gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Redirecting to System Login
                </p>
                <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-corporate-blue animate-[loading_4s_ease-in-out]" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={14} />
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}