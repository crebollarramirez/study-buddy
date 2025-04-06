import React from "react";
import Avatar from "./avatar";
import Counter from "./counter";

export default function Sidebar() {
  return (
    <div className="flex flex-col w-[30%] h-full ml-4">
      <div className="flex flex-col bg-white rounded-md shadow-lg h-full">
        {/* Header */}
        <div className="bg-blue-600/80 text-white p-4 rounded-t-lg flex items-center justify-center">
          <h2 className="text-lg font-semibold">Your Progress</h2>
        </div>
        
        {/* Content */}
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <Counter />
          <Avatar />
        </div>
      </div>
    </div>
  );
}