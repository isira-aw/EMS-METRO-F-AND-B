'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import LeftSidebar from './LeftSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(authService.getStoredUser());
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-light-bg">
      <LeftSidebar role="ADMIN" user={user} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
