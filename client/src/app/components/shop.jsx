import React, { useState } from "react";
import duck from "../../../public/duckscholar.png";
import duck2 from "../../../public/duckscholar_2.png";
import duck3 from "../../../public/duckscholar_3.png";
import Image from "next/image";
import server from "../../server";

export default function Shop() {
  const [selectedDuck, setSelectedDuck] = useState(null);
  
  // const handlePurchase = async () => {
  //   if (!selectedDuck) return;
    
  //   try {
  //     // Replace with your actual endpoint
  //     await server.post("/purchase-avatar", { avatarId: selectedDuck });
  //     alert("Avatar purchased successfully!");
  //   } catch (error) {
  //     console.error("Error purchasing avatar:", error);
  //     alert("Not enough brain points to purchase this item.");
  //   }
  // };

  return (
    <div className="flex flex-col w-[70%] h-full bg-white rounded-md shadow-lg">
      {/* Header */}
      <div className="bg-blue-600/80 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">Brain Points Shop</h2>
      </div>

      {/* Shop Content */}
      <div className="flex-grow p-6 overflow-y-auto">
        <h3 className="text-xl font-bold text-blue-600 mb-4">Select Your Study Buddy</h3>
        
        <div className="grid grid-cols-3 gap-6">
          {[
            { id: 1, image: duck, name: "Professor Duck", price: 100 },
            { id: 2, image: duck2, name: "Scholar Duck", price: 150 },
            { id: 3, image: duck3, name: "Wizard Duck", price: 200 }
          ].map((item) => (
            <div 
              key={item.id}
              className={`bg-blue-50 rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedDuck === item.id ? "ring-2 ring-blue-600 shadow-md" : "border border-gray-200"
              }`}
              onClick={() => setSelectedDuck(item.id)}
            >
              <div className="relative w-32 h-32 mb-4">
                <Image 
                  src={item.image} 
                  alt={item.name}
                  layout="fill"
                  objectFit="contain"
                  className="transition-transform duration-300 hover:scale-110"
                />
              </div>
              
              <h4 className="font-bold text-lg text-blue-800">{item.name}</h4>
              <p className="text-blue-600 font-medium">{item.price} Brain Points</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-100 rounded-b-lg flex items-center justify-between">
        <div className="text-gray-700">
          {selectedDuck ? "Ready to purchase your new study buddy?" : "Select an avatar to purchase"}
        </div>
        <button
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            selectedDuck
              ? "bg-blue-600/80 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          // onClick={handlePurchase}
          disabled={!selectedDuck}
        >
          Purchase
        </button>
      </div>
    </div>
  );
}