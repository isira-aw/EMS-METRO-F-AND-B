'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = authService.getRole();

    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'EMPLOYEE') {
      router.push('/employee/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
