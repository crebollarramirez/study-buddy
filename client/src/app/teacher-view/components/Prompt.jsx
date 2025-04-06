import React, { useState } from "react";
import server from "../../../server"; // Import the server instance

const Prompt = () => {
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await server.post("/bot/set-prompt", { prompt: input });
      if (response.status === 200) {
        console.log("Prompt set successfully:", response.data);
        alert("Prompt submitted successfully!");
      } else {
        console.error("Failed to set prompt:", response.statusText);
        alert("Failed to submit the prompt.");
      }
    } catch (error) {
      console.error("Error submitting prompt:", error);
      alert("An error occurred while submitting the prompt.");
    }
  };

  const deletePrompt = async () => {
    try {
      const response = await server.delete("/bot/delete-prompt");
      if (response.status === 200) {
        console.log("Prompt deleted successfully:", response.data);
        alert("Prompt deleted successfully!");
      }
    }
    catch (error) {
      console.error("Error deleting prompt:", error);
      alert("An error occurred while deleting the prompt.");
    }
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="h-full w-full flex-grow bg-white rounded-md shadow-lg flex flex-col">
      {/* Header */}
      <div className="bg-blue-600/80 text-white p-4 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-semibold">Set Learning Prompt</h2>
      </div>
      
      {/* Content */}
      <div className="flex-grow flex flex-col p-4">
        <textarea
          type="text"
          className="w-full border border-gray-300 text-black rounded-lg p-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should your students learn today? Enter your prompt here."
        />

        <div className="flex flex-row space-x-2 justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600/80 text-white transition-all duration-300 hover:bg-blue-700 hover:scale-105 hover:shadow-lg"
            onClick={handleSubmit}
          >
            Submit
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-gray-500 text-white transition-all duration-300 hover:bg-gray-600 hover:scale-105 hover:shadow-lg"
            onClick={deletePrompt}
          >
            Delete Old Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

export default Prompt;