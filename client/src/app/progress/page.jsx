"use client";

import React from "react";
import NavBar from "../components/navbar";
import HomeNavbar from "../components/HomeNavbar";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ProgressPage() {
  // Calculate days left until deadline (9/20/25)
  const deadline = new Date('2025-09-20');
  const currentDate = new Date('2025-09-17');
  const daysLeft = Math.ceil((deadline - currentDate) / (1000 * 60 * 60 * 24));

  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-row overflow-hidden">
            <div className="flex-1 h-full flex flex-col bg-[#EDF6F9] overflow-hidden">
              {/* Progress Overview Section */}
              <div className="p-8 flex-shrink-0">
                <div className="flex items-center justify-between mb-6 mt-8">
                  <h1 className="text-3xl font-bold text-gray-800">My Progress</h1>
                  <div className="flex items-center gap-4">
                    <span className="text-lg text-gray-600">Level 3</span>
                    <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#8AC0A8] rounded-full" style={{ width: "50%" }}></div>
                    </div>
                    <span className="text-lg text-gray-600">50 % Complete</span>
                  </div>
                </div>

                {/* Filter and Sort Options */}
                <div className="flex gap-4 mb-2 mt-12">
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    Last 30 days
                    <span className="text-gray-400">▼</span>
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    Subject
                    <span className="text-gray-400">▼</span>
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    Sort By
                    <span className="text-gray-400">▼</span>
                  </button>
                </div>
              </div>

              {/* Content Sections */}
              <div className="flex-1 p-8 pt-0 min-h-0 overflow-y-auto">
                {/* Upcoming Conversations Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-gray-800 mb-6">Upcoming Conversations</h2>
                  
                  <div className="space-y-4">
                    {/* Math 18 Entry */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Math 18</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#8AC0A8] rounded-full" style={{ width: "20%" }}></div>
                          </div>
                          <span className="text-sm text-gray-600">{daysLeft} days left</span>
                        </div>
                      </div>
                    </div>

                    {/* BILD 3 Entry */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">BILD 3</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: "80%" }}></div>
                          </div>
                          <span className="text-sm text-gray-600">2 days left</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practice More Section */}
                <div>
                  <h2 className="text-2xl font-medium text-gray-800 mb-6">Practice More</h2>
                  
                  <div className="space-y-4">
                    {/* Math 18 Practice Entry */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Math 18</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#8AC0A8] rounded-full" style={{ width: "33%" }}></div>
                          </div>
                          <span className="text-sm text-gray-600">100 / 300 BP</span>
                        </div>
                      </div>
                    </div>

                    {/* CSE 12 Practice Entry */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-400"></div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">CSE 12</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: "93%" }}></div>
                          </div>
                          <span className="text-sm text-gray-600">280 / 300 BP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-48 h-full overflow-hidden">
              <HomeNavbar />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
