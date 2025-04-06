"use client";

import React, { useState, useEffect } from "react";
import server from "../../server";
import Image from "next/image";
import brain from "../../../public/brain_pixel.png";

export default function Counter() {
  const [counterState, setCounterState] = useState(0);

  const getUserPoints = async () => {
    try {
      const response = await server.get("/brain_points", { withCredentials: true });
      console.log(response.data);
      setCounterState(response.data.brain_points);
    } catch (error) {
      console.error("Error fetching brain points:", error);
      // Handle error gracefully - maybe set a default value or error state
      setCounterState(0);
    }
  };

  useEffect(() => {
    getUserPoints();
  }, []);

  return (
    <div className="bg-green-400 justify-center flex items-center h-full relative">
      {/* Counter number */}
      {/* Brain image */}
      <p className="absolute text-black font- text-6xl font-bold mb-10">{counterState}</p>
      {/* Brain image */}
      <Image src={brain} alt="Brain" width={250} height={250} />
    </div>
  );
}