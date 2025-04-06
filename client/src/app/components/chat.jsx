"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "@/constants";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const chatWindowRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL);

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("response", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: data.message, isUser: false },
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle sending messages
  const handleSend = () => {
    if (input.trim() && socket) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, isUser: true },
      ]);

      socket.emit("message", JSON.stringify({ message: input, user_id: "current_user" }));
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">Study Buddy</h2>
        <span
          className={`text-sm ${
            isConnected ? "text-green-300" : "text-red-300"
          }`}
        >
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>

      {/* Chat Window */}
      <div
        className="flex-grow overflow-y-auto h-[75vh] p-4 space-y-4"
        ref={chatWindowRef}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs p-3 rounded-lg text-sm ${
                message.isUser
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black "
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-gray-100 rounded-b-lg flex items-center space-x-2">
        <input
          type="text"
          className="flex-grow border border-gray-300 text-black rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <button
          className={`px-4 py-2 rounded-lg ${
            isConnected
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={handleSend}
          disabled={!isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
}