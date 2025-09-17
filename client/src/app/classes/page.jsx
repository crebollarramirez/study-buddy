"use client";

import React from "react";
import NavBar from "../components/navbar";
import Sidebar from "../components/sidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import ClassList from "../components/ClassList";

export default function ClassesPage() {
  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-row overflow-hidden">
            <div className="flex-1 h-full overflow-hidden">
              <ClassList />
            </div>
            <div className="w-[360px] h-full overflow-hidden">
              <Sidebar />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
