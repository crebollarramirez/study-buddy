// import React from "react";

// export default function Chat() {
//     return (
//       <div className="bg-white">


        
//       </div>
//     );
//   }

"use client";
  
import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "./chatbubble";
import { incrementCounter } from "./counter";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatWindowRef = useRef(null); // Create a ref for the chat window

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
      incrementCounter();
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


  // Dummy data
  const smallDummyData = [
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false]
  ];

  const dummyData = [
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false],
    ["Hello! How can I help you today?", true],
    ["What is your name?", false],
    ["Where are you from?", true],
    ["What do you do?", true],
    ["How can I assist you?", false]
  ];

  return (
<div className="bg-white h-full w-full rounded shadow">
  <div className="overflow-y-hidden h-[75vh]" ref={chatWindowRef}>
    {[...dummyData, ...messages].map((message, index) => (
      <ChatBubble 
        key={index} 
        message={Array.isArray(message) ? message[0] : message} 
        isUser={Array.isArray(message) ? message[1] : false} 
      />
    ))}
  </div>

  <div className="flex text-cyan-950 h-[10%]">
    <input
      type="text"
      className="flex-grow border p-2 rounded"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type a message..."
    />
    <button
      className="ml-2 bg-blue-500 text-white p-2 rounded"
      onClick={handleSend}
    >
      Send
    </button>
  </div>
</div>
  );
}
