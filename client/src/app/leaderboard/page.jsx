"use client";

import React from "react";
import NavBar from "../components/navbar";
import HomeNavbar from "../components/HomeNavbar";
import ProtectedRoute from "../components/ProtectedRoute";
import Image from "next/image";
import brain from "../../../public/brain_pixel.png";

export default function Leaderboard() {
  const players = [
    { rank: 1, name: "Bobby Brown", tier: "Platinum", points: 1700 },
    { rank: 2, name: "Emily Evans", tier: "Gold", points: 1600 },
    { rank: 3, name: "Name Here", tier: "Rank", points: "XXXX" },
    { rank: 4, name: "Name Here", tier: "Rank", points: "XXXX" },
    { rank: 5, name: "Name Here", tier: "Rank", points: "XXXX" },
    { rank: 6, name: "Name Here", tier: "Rank", points: "XXXX" },
    { rank: 7, name: "Name Here", tier: "Rank", points: "XXXX" },
    { rank: 8, name: "Name Here", tier: "Rank", points: "XXXX" },
  ];

  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-row overflow-hidden">
            <div className="flex-1 h-full flex flex-col bg-[#EDF6F9] overflow-hidden">
              {/* Header Section */}
              <div className="p-8 flex-shrink-0">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">LeaderBoard</h1>
                  <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    Filter by Class
                    <span className="text-gray-400">▼</span>
                  </button>
                </div>

                {/* Top Ranked Players Banner */}
                <div className="relative">
                  <div className="w-full h-px bg-gray-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-[#EDF6F9] px-4 text-gray-800 font-medium">Top Ranked Players</span>
                  </div>
                </div>
              </div>

              {/* Player List */}
              <div className="flex-1 p-8 pt-0 min-h-0 overflow-y-auto">
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.rank} className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          {/* Rank Number */}
                          <span className="text-3xl font-bold text-gray-800 w-12 text-center">
                            {player.rank}
                          </span>
                          
                          {/* Avatar Placeholder */}
                          <div className="w-16 h-16 rounded-full bg-gray-300"></div>
                          
                          {/* Player Info */}
                          <div className="flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-800">{player.name}</h3>
                            <p className="text-sm text-gray-600">{player.tier}</p>
                          </div>
                        </div>
                        
                        {/* Brain Points */}
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6">
                            <Image
                              src={brain}
                              alt="Brain"
                              fill
                              style={{ objectFit: "contain" }}
                            />
                          </div>
                          <span className="text-lg font-semibold text-gray-800">
                            {player.points} BP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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




