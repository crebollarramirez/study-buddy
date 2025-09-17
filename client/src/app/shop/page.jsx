"use client";

import React, { useState } from "react";
import NavBar from "../components/navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import Image from "next/image";
import duck from "../../../public/duckscholar.png";
import brain from "../../../public/brain_pixel.png";

export default function ShopPage() {
  const [selectedCharacter, setSelectedCharacter] = useState({
    id: 1,
    name: "Bob the Builder",
    costume: "Core Costume",
    image: duck,
    isSelected: true
  });

  const characters = [
    { id: 1, name: "Bob the Builder", costume: "Core Costume", image: duck, isSelected: true, cost: 0 },
    { id: 2, name: "Bob the Builder", costume: "Construction Worker", image: duck, isSelected: false, cost: 358 },
    { id: 3, name: "Bob the Builder", costume: "Engineer", image: duck, isSelected: false, cost: 258 },
    { id: 4, name: "Bob the Builder", costume: "Architect", image: duck, isSelected: false, cost: 0 },
    { id: 5, name: "Bob the Builder", costume: "Foreman", image: duck, isSelected: false, cost: 0 },
    { id: 6, name: "Bob the Builder", costume: "Supervisor", image: duck, isSelected: false, cost: 0 },
    { id: 7, name: "Bob the Builder", costume: "Manager", image: duck, isSelected: false, cost: 0 },
    { id: 8, name: "Bob the Builder", costume: "Director", image: duck, isSelected: false, cost: 0 },
    { id: 9, name: "Bob the Builder", costume: "Coordinator", image: duck, isSelected: false, cost: 0 },
    { id: 10, name: "Bob the Builder", costume: "Specialist", image: duck, isSelected: false, cost: 0 },
    { id: 11, name: "Bob the Builder", costume: "Expert", image: duck, isSelected: false, cost: 0 },
    { id: 12, name: "Bob the Builder", costume: "Master", image: duck, isSelected: false, cost: 0 },
    { id: 13, name: "Bob the Builder", costume: "Leader", image: duck, isSelected: false, cost: 0 },
    { id: 14, name: "Bob the Builder", costume: "Chief", image: duck, isSelected: false, cost: 0 },
    { id: 15, name: "Bob the Builder", costume: "Boss", image: duck, isSelected: false, cost: 0 },
    { id: 16, name: "Bob the Builder", costume: "Commander", image: duck, isSelected: false, cost: 0 },
  ];

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
  };

  return (
    <ProtectedRoute requiredRole="student">
      <main className="w-screen h-screen">
        <div className="w-full h-full flex flex-row overflow-hidden">
          <NavBar />
          <div className="flex-1 h-full flex flex-col bg-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="p-8 flex-shrink-0">
              <div className="flex items-center justify-between mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  Filter By
                  <span className="text-gray-400">▼</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 pt-0 min-h-0 overflow-hidden">
              <div className="flex gap-8 h-full">
                {/* Selected Character Card */}
                <div className="w-80 flex-shrink-0">
                  <div className="bg-white rounded-lg border border-gray-300 p-6 h-full flex flex-col">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">{selectedCharacter.name}</h2>
                      <p className="text-sm text-gray-600">{selectedCharacter.costume}</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center mb-6">
                      <div className="relative w-48 h-48">
                        <Image
                          src={selectedCharacter.image}
                          alt={selectedCharacter.name}
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                    
                    <button className={`w-full py-3 rounded-lg font-medium ${
                      selectedCharacter.costume === "Core Costume" 
                        ? "bg-gray-500 text-white" 
                        : selectedCharacter.cost > 0 
                          ? "bg-blue-500 text-white hover:bg-blue-600" 
                          : "bg-green-500 text-white hover:bg-green-600"
                    }`}>
                      {selectedCharacter.costume === "Core Costume" 
                        ? "Selected" 
                        : selectedCharacter.cost > 0 
                          ? `Buy (${selectedCharacter.cost} BP)` 
                          : "Select"}
                    </button>
                  </div>
                </div>

                {/* Character Grid */}
                <div className="flex-1 min-h-0">
                  <div className="bg-white py-10 rounded-lg border border-gray-300 p-6 h-full">
                    <div className="grid grid-cols-4 gap-4 h-full overflow-y-auto">
                      {characters.map((character) => (
                        <div
                          key={character.id}
                          className={`relative py-10 px-12 rounded-lg border-2 cursor-pointer transition-all ${
                            character.id === selectedCharacter.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleCharacterSelect(character)}
                        >
                          {/* Checkmark for selected character */}
                          {character.id === selectedCharacter.id && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Brain Points for characters with cost */}
                          {character.cost > 0 && (
                            <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-full">
                              <div className="relative w-4 h-4">
                                <Image
                                  src={brain}
                                  alt="Brain"
                                  fill
                                  style={{ objectFit: "contain" }}
                                />
                              </div>
                              <span className="text-xs font-medium text-pink-600">{character.cost} BP</span>
                            </div>
                          )}
                          
                          {/* Character Avatar */}
                          <div className="flex flex-col items-center">
                            <div className="w-[5vw] h-[5vw] rounded-full bg-gray-300 flex items-center justify-center mb-2">
                              <div className="relative w-12 h-12">
                                <Image
                                  src={character.image}
                                  alt={character.name}
                                  fill
                                  style={{ objectFit: "contain" }}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 text-center">{character.costume}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
