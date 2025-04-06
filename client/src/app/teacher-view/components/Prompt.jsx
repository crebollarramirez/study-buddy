// "use client";

// import React, { useEffect, useState } from 'react';

// import server from '@/server';

// // const handleSend = () => {
// //     {/* TODO */}

// // }

// // const handleKeyDown = (e) => {
// //     if (e.key === "Enter") {
// //       handleSend();
// //     }
// //   };

// const Prompt = () => {
//     const [input, setInput] = useState("");

//     return <div className="p-4 bg-gray-300 rounded-b-lg flex flex-col h-full w-full justify-between items-center space-x-2 border text-black">

//     <div className='flex w-full h-full'>
//         <textarea
//         type="text"
//         className="w-full border bg-gray-100 border-gray-300 text-black rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500]"
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         //   onKeyDown={handleKeyDown}
//         placeholder="What should your students learn today? Enter your prompt here."
//         //   disabled={!isConnected}
//         />
//     </div>

//     <div className='flex flex-row space-x-2 justify-center flex-grow'>
//         <button
//         className={`px-4 py-2 rounded-lg` 
//         //     ${
//         //     isConnected
//         //       ? "bg-blue-500 text-white hover:bg-blue-600"
//         //       : "bg-gray-300 text-gray-500 cursor-not-allowed"
//         //   }
//         //  `}
//         }
//         onClick={null}
//         //   disabled={!isConnected}
//         >
//         Submit    
//         </button>

//         <button
//         className={`px-4 py-2 rounded-lg` 
//         //     ${
//         //     isConnected
//         //       ? "bg-blue-500 text-white hover:bg-blue-600"
//         //       : "bg-gray-300 text-gray-500 cursor-not-allowed"
//         //   }
//         //  `}
//         }
//         onClick={null}
//         //   disabled={!isConnected}
//         >
//         Delete Old Prompt   
//         </button>
//     </div>
//   </div>

// };

// export default Prompt;

"use client";

import React, { useEffect, useState } from 'react';

import server from '@/server';

// const handleSend = () => {
//     {/* TODO */}

// }

// const handleKeyDown = (e) => {
//     if (e.key === "Enter") {
//       handleSend();
//     }
//   };

const Prompt = () => {
    const [input, setInput] = useState("");

    return <div className="p-4 bg-black rounded-b-lg flex flex-col h-full w-full justify-between items-center space-x-2 border border-red-500 text-white">

    <div className='flex w-full h-full'>
        <textarea
        type="text"
        className="w-full border bg-black border-red-500 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        //   onKeyDown={handleKeyDown}
        placeholder="What should your students learn today? Enter your prompt here."
        //   disabled={!isConnected}
        />
    </div>

    <div className='flex flex-row space-x-2 justify-center flex-grow items-center'>
        <button
        className={`px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600` 
        //     ${
        //     isConnected
        //       ? "bg-blue-500 text-white hover:bg-blue-600"
        //       : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //   }
        //  `}
        }
        onClick={null}
        //   disabled={!isConnected}
        >
        Submit    
        </button>

        <button
        className={`px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700` 
        //     ${
        //     isConnected
        //       ? "bg-blue-500 text-white hover:bg-blue-600"
        //       : "bg-gray-300 text-gray-500 cursor-not-allowed"
        //   }
        //  `}
        }
        onClick={null}
        //   disabled={!isConnected}
        >
        Delete Old Prompt   
        </button>
    </div>
  </div>

};

export default Prompt;