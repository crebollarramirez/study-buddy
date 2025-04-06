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

//   const getPrompt = async () => {
//     try{
//         server.get("/bot/get-prompt").then((response) => {
            
//         );

//         setInput(response.data.prompt);}

//     }catch(error){
//         console.error("Error getting prompt:", error);
//         }
//   };

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
    <div className="p-4 bg-black rounded-b-lg flex flex-col h-full w-full justify-between items-center space-x-2 border border-red-500 text-white">
      <div className="flex w-full h-full">
        <textarea
          type="text"
          className="w-full border bg-black border-red-500 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What should your students learn today? Enter your prompt here."
        />
      </div>

      <div className="flex flex-row space-x-2 justify-center flex-grow items-center">
        <button
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          onClick={handleSubmit}
        >
          Submit
        </button>

        <button
          className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
          onClick={deletePrompt}
        >
          Delete Old Prompt
        </button>
      </div>
    </div>
  );
};

export default Prompt;