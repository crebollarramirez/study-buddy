"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import server from '../../server';

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const response = await server.get('/account-type');
        const userRole = response.data.account_type;

        // If user is not authenticated (no role), redirect to login
        if (!userRole) {
          router.push('/login');
          return;
        }

        // Redirect based on user role if not on the correct page
        if (userRole === 'student' && requiredRole !== 'student') {
          router.push('/');
          return;
        }
        
        if (userRole === 'teacher' && requiredRole !== 'teacher') {
          router.push('/teacher-view');
          return;
        }

        // If role doesn't match required role, redirect appropriately
        if (requiredRole && userRole !== requiredRole) {
          if (userRole === 'student') {
            router.push('/');
          } else if (userRole === 'teacher') {
            router.push('/teacher-view');
          } else {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, [router, requiredRole]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return children;
}