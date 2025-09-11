"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import server from "../../server";

export default function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const response = await server.get("/auth/isAuthenticated");

        // Check if user is authenticated
        if (!response.data.authenticated) {
          router.push("/login");
          return;
        }

        const userRole = response.data.account_type?.toLowerCase(); // Normalize to lowercase


        // If user is authenticated but has no role, redirect to login
        if (!userRole) {
          router.push("/login");
          return;
        }

        // Check if user should be redirected based on their role
        if (userRole === "student" && requiredRole !== "student") {
          router.push("/");
          return;
        }

        if (userRole === "teacher" && requiredRole !== "teacher") {
          router.push("/teacher-view");
          return;
        }

        // If role doesn't match required role, redirect appropriately
        if (requiredRole && userRole !== requiredRole) {
          if (userRole === "student") {
            router.push("/");
          } else if (userRole === "teacher") {
            router.push("/teacher-view");
          } else {
            router.push("/login");
          }
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        // If there's a network error or server error, redirect to login
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuthentication();
  }, [router, requiredRole]);

  // Show loading until authentication is checked AND user is authorized
  if (loading || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
}
