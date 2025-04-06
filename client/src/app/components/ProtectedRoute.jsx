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

        // Check if the user is authenticated and has the required role
        if (!userRole || (requiredRole && userRole !== requiredRole)) {
          router.push('/login'); // Redirect to home if not authenticated or role doesn't match
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        router.push('/'); // Redirect to home on error
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