"use client";

import React, { useState } from "react";
import Chat from "./components/chat";
import Shop from "./components/shop";
import NavBar from "./components/navbar";
import Sidebar from "./components/sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Pixelify_Sans } from 'next/font/google';

export const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
}); 

export default function Home() {
  const [activeComponent, setActiveComponent] = useState("chat");

  return (
    <ProtectedRoute requiredRole="student">
      <main className={`w-screen h-screen ${pixelifySans.className}`}>
        <NavBar 
          activeComponent={activeComponent}
          setActiveComponent={setActiveComponent}
        />
        <div className="h-[95%] w-full flex flex-row justify-center items-center px-4">
          {activeComponent === "chat" ? <Chat /> : <Shop />}
          <Sidebar />
        </div>
      </main>
    </ProtectedRoute>
  );
}