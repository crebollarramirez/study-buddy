import React from "react";
import duck from "../../../public/duckscholar.png";
import duck2 from "../../../public/duckscholar_2.png";
import duck3 from "../../../public/duckscholar_3.png";
import Image from "next/image";

export default function ChatFiller() {
  return (
    <div className="flex flex-col h-full bg-gray-200 rounded-lg shadow-md border border-gray-300">
      {/* Header */}
      <div className="bg-gray-400 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">Brain Points Shop</h2>
      </div>

      {/* Shop Clickables */}
      <div className="flex flex-row h-full p-4 space-y-4 border-8 w-full">
        <Image src={ duck } className="bg-gray-300 w-[10vh] h-[10vh] rounded-lg" />
        <Image src={ duck2 } className="bg-gray-300 w-[10vh] h-[10vh]  rounded-lg" />
        <Image src={ duck3 } className="bg-gray-300 w-[10vh] h-[10vh]  rounded-lg" />
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-400 rounded-b-lg flex items-center space-x-2">
        <div className="bg-gray-300 h-10 flex-grow rounded-lg"></div>
        <div className="bg-gray-300 h-10 w-20 rounded-lg"></div>
      </div>
    </div>
  );
}