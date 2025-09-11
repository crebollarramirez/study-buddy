"use client";

import { API_URL } from "@/constants";

const logoutButton = () => {
    const handleLogout = () => {
        window.location.href = `${API_URL}/auth/logout`;
    };

    return (
        <div>
            <button
                className="ml-2 bg-blue-500/80 text-white p-2 rounded transition-all duration-300 hover:bg-blue-600 hover:scale-105 hover:shadow-lg"
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );
};

export default logoutButton;