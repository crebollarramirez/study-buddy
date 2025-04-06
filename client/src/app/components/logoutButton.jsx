"use client";

const logoutButton = () => {
    const handleLogout = () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; // Replace with your API URL
        window.location.href = `${API_URL}/logout`;
    };

    return (
        <div>
            <button
                className="ml-2 bg-blue-500 text-white p-2 rounded"
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );
};

export default logoutButton;