"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import server from '../../server';

export default function ProtectedRoute({ children, requiredRole }) {
  // DEV OVERRIDE: Bypass authentication and role checks to go straight to the app
  // const [loading, setLoading] = useState(true);
  // const router = useRouter();
  // useEffect(() => {
  //   async function checkAuthentication() {
  //     try {
  //       const response = await server.get('/account-type');
  //       const userRole = response.data.account_type;
  //       if (!userRole) {
  //         router.push('/login');
  //         return;
  //       }
  //       if (userRole === 'student' && requiredRole !== 'student') {
  //         router.push('/');
  //         return;
  //       }
  //       if (userRole === 'teacher' && requiredRole !== 'teacher') {
  //         router.push('/teacher-view');
  //         return;
  //       }
  //       if (requiredRole && userRole !== requiredRole) {
  //         if (userRole === 'student') {
  //           router.push('/');
  //         } else if (userRole === 'teacher') {
  //           router.push('/teacher-view');
  //         } else {
  //           router.push('/login');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error checking authentication:', error);
  //       router.push('/login');
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   checkAuthentication();
  // }, [router, requiredRole]);
  // if (loading) {
  //   return <div className="flex h-screen items-center justify-center">Loading...</div>;
  // }
  return children;
}