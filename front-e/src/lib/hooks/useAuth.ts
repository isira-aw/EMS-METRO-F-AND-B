'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';

export function useAuth(requiredRole?: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();

      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      const userData = authService.getStoredUser();

      if (requiredRole && userData.role !== requiredRole) {
        // Redirect to appropriate dashboard
        if (userData.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/employee/dashboard');
        }
        return;
      }

      setUser(userData);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  return { user, isLoading };
}
