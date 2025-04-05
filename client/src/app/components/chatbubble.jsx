import React from "react";

export default function ChatBubble({message}) {
    return (
      <div className="bg-red-400">
        {message}
      </div>
    );
  }