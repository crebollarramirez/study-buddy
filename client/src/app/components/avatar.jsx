import React from "react";
import duck from "../../../public/duckscholar.png";
import Image from "next/image";

export default function Avatar({ name = duck }) {
  return (
    <div className="flex flex-col items-center justify-center h-1/2 w-full mt-4">
      <div className="text-blue-600/80 text-xl font-bold mb-2">Study Buddy</div>
      <div className="bg-blue-50 rounded-full p-2 shadow-md border-2 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="relative w-48 h-48">
          <Image 
            src={name} 
            alt="Duck Scholar" 
            layout="fill" 
            objectFit="contain"
            className="drop-shadow-md"
          />
        </div>
      </div>
      <div className="mt-4 text-gray-600 text-sm text-center">
        Your friendly AI learning companion
      </div>
    </div>
  );
}