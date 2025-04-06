import React, { useState, useEffect } from "react";
import server from "../../../server";

const SelectedChatLog = () => {
  const [chatLogs, setChatLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChatLogs = async () => {
      setLoading(true);
      try {
        const response = await server.get("/messages");
        setChatLogs(response.data.messages);
        setError(null);
      } catch (err) {
        console.error("Error fetching chat logs:", err);
        setError("Failed to load chat logs");
      } finally {
        setLoading(false);
      }
    };

    fetchChatLogs();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex-grow bg-white rounded-md shadow-lg flex items-center justify-center text-black">
        Loading chat logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex-grow bg-white rounded-md shadow-lg flex items-center justify-center text-black">
        Error: {error}
      </div>
    );
  }

  // Organize all messages by prompt
  const logsByPrompt = {};
  
  // Process all students' chat logs
  Object.entries(chatLogs).forEach(([email, logs]) => {
    logs.forEach(log => {
      const prompt = log.prompt || "No Prompt";
      if (!logsByPrompt[prompt]) {
        logsByPrompt[prompt] = [];
      }
      // Add the email to the log object to identify the student
      logsByPrompt[prompt].push({
        ...log,
        email
      });
    });
  });

  // Sort messages by timestamp within each prompt
  Object.keys(logsByPrompt).forEach(prompt => {
    logsByPrompt[prompt].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  return (
    <div className="h-full w-full flex-grow bg-white rounded-md shadow-lg flex flex-col">
      {/* Header */}
      <div className="bg-blue-600/80 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">Student Conversations</h2>
      </div>
      
      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {Object.keys(logsByPrompt).length === 0 ? (
          <div className="text-center my-8 text-gray-500">No chat logs found</div>
        ) : (
          Object.keys(logsByPrompt).map(prompt => (
            <div key={prompt} className="mb-6 bg-gray-100 rounded-lg p-4 shadow">
              <h3 className="text-lg font-semibold mb-2 border-b border-gray-300 pb-2 text-blue-600">
                Prompt: {prompt}
              </h3>
              <div className="space-y-2">
                {logsByPrompt[prompt].map((message, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg ${
                      message.sender === "student" 
                        ? "bg-blue-600/80 text-white ml-4" 
                        : "bg-gray-200 text-black mr-4"
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span>{message.sender === "student" ? `Student: ${message.email}` : "Assistant"}</span>
                      <span>{new Date(message.timestamp).toLocaleString()}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SelectedChatLog;