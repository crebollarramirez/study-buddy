"use client";

import React, { useState, useEffect } from "react";
import server from "../../server";
import Image from "next/image";
import brain from "../../../public/brain_pixel.png";

export default function Counter() {
  const [counterState, setCounterState] = useState(0);
  const [loading, setLoading] = useState(true);

  const getUserPoints = async () => {
    try {
      setLoading(true);
      const response = await server.get("/brain_points");
      setCounterState(response.data.brain_points);
    } catch (error) {
      console.error("Error fetching brain points:", error);
      setCounterState(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserPoints();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-1/2">
      <div className="text-blue-600/80 text-xl font-bold mb-2">Brain Points</div>
      <div className="relative flex items-center justify-center">
        <div className="absolute z-10 flex items-center justify-center">
          <p className={`text-6xl font-bold ${loading ? 'text-gray-400' : 'black'}`}>
            {loading ? "..." : counterState}
          </p>
        </div>
        <div className="relative w-60 h-60 opacity-80 hover:opacity-100 transition-all duration-700">
          <Image 
            src={brain} 
            alt="Brain" 
            layout="fill" 
            objectFit="contain"
            className="animate-pulse"
          />
        </div>
      </div>
      <div className="mt-4 text-gray-600 text-sm text-center">
        Answer questions correctly to earn more brain points!
      </div>
    </div>
  );
}