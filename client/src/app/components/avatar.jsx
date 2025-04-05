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

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatWindowRef = useRef(null); // Create a ref for the chat window

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
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
    <div className="bg-white p-4 h-full max-h-full rounded shadow">
      <div className="mb-4 overflow-y-hidden h-[80%] 
      max-h-[80%]" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
      </div>


      <div className="chat-input flex text-cyan-950">
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
