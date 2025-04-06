"use client";

const logoutButton = () => {
    const handleLogout = () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; // Replace with your API URL
        window.location.href = `${API_URL}/logout`;
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