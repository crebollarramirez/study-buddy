import React from "react";

export default function ChatBubble({message, isUser}) {

    if (isUser) {
      return (
        <div className="bg-red-400 text-left">
          {message}
        </div>
      );
    } else {
      return (
        <div className="bg-blue-400 text-left">
          {message}
        </div>
      );
    }
  }