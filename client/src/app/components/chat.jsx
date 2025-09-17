"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/constants";
import { useRouter } from "next/navigation";

export default function Chat({ classId = "demo" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [brainPoints, setBrainPoints] = useState(0);
  const chatWindowRef = useRef(null);
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL, { withCredentials: true });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("response", (data) => {
      const points = Math.floor(Math.random() * 60) + 5; // Random points between 5-64
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.message, isUser: false, points: points },
      ]);
      setBrainPoints(prev => prev + points);
    });

    // Join room for selected class
    newSocket.on("connect", () => {
      newSocket.emit("join", { room: classId });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [classId]);

  // Handle sending messages
  const handleSend = () => {
    if (input.trim() && socket) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);

      socket.emit("message", JSON.stringify({ message: input, classId }));
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="bg-[#8AC0A8] text-black p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/classes')}
            className="text-black hover:text-gray-700 transition-colors"
          >
            <span className="text-xl">←</span>
          </button>
          <h2 className="text-2xl font-semibold">CSE 12 Smith A00</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm text-black">online</span>
        </div>
      </div>

      {/* Chat Window */}
      <div
        className="flex-grow overflow-y-scroll p-4 space-y-4 bg-[#EDF6F9]"
        ref={chatWindowRef}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex flex-col">
              <div
                className={`max-w-xs p-3 rounded-lg text-sm relative ${
                  message.isUser
                    ? "bg-[#2D5A3D] text-white"
                    : "bg-[#D1E7DD] text-gray-800"
                }`}
                style={{
                  clipPath: message.isUser 
                    ? "polygon(0% 0%, calc(100% - 8px) 0%, 100% 8px, 100% 100%, 0% 100%)"
                    : "polygon(8px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 8px)"
                }}
              >
                {message.text}
              </div>
              {!message.isUser && message.points && (
                <div className="text-xs text-gray-600 mt-1 ml-2">
                  + {message.points} BrainPoints
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-[#8AC0A8] flex items-center gap-3 relative">
        <input
          type="text"
          className="flex-grow bg-white text-black rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isConnected
              ? "bg-[#8AC0A8] text-black hover:bg-[#6BA68A] border border-black"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isConnected}
        >
          <span className="text-lg">→</span>
        </button>
        <button
          className={`bg-[#016D77] absolute mb-[10vw] right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isConnected
              ? "bg-[#8AC0A8] text-black hover:bg-[#6BA68A] border border-black"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isConnected}
        >
          <span className="text-white text-[10rem] text-sm">?</span>
        </button>
      </div>
    </div>
  );
}
