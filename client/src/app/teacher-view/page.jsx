"use client";

import React from "react";
import ChatLogs from "./components/ChatLogs";
import Prompt from "./components/Prompt";
import NavBar from "../components/navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { Pixelify_Sans } from "next/font/google";

export const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const TeacherHome = () => {
  return (
    <ProtectedRoute requiredRole="teacher">
      <main className={`w-screen h-screen ${pixelifySans.className}`}>
        <NavBar />
        <div className="h-[95%] w-full flex flex-row justify-center items-center gap-2 px-4">
          <Prompt />
          <ChatLogs />
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default TeacherHome;
