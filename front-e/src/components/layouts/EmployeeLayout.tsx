'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import LeftSidebar from './LeftSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  pendingJobsCount?: number;
}

export default function EmployeeLayout({ children, pendingJobsCount }: EmployeeLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = authService.getRole();
    if (role !== 'EMPLOYEE') {
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
      <LeftSidebar role="EMPLOYEE" user={user} pendingJobsCount={pendingJobsCount} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
