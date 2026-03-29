'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Strict RBAC Redirection Logic
        if (user.role === 'Admin') {
          router.push('/admin'); // Admin fallback
        } else {
          router.push('/dashboard'); // Employee fallback
        }
      }
    }
  }, [isClient, isAuthenticated, user, allowedRoles, router, pathname]);

  if (!isClient || !isAuthenticated) return null; // Or a sleek loading spinner

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
     return null; // Prevents flashing unauthorized content before redirect
  }

  return <>{children}</>;
}
