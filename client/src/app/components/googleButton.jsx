"use client";

import React from "react";
import Image from "next/image";

const GoogleButton = ({ type = "Login", handleGoogleLogin }) => {
  return (
    <button
      className="px-4 py-2 border flex items-center justify-center gap-2 border-slate-200 dark:border-slate-700 rounded-lg text-white bg-gray-800 hover:bg-blue-600 dark:bg-gray-800 dark:hover:bg-gray-800 hover:shadow transition duration-150"
      onClick={handleGoogleLogin}
    >
      <Image
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google logo"
        width={24}
        height={24}
        className="w-6 h-6"
      />
      <span>{`${type} using Google`}</span>
    </button>
  );
};

export default GoogleButton;
