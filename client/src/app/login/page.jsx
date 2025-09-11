"use client";
import GoogleButton from "../components/googleButton";
import { API_URL } from "@/constants";

export default function Login() {
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission
    // Redirect to the backend Google OAuth login endpoint
    window.location.href = `${API_URL}/auth/login`;
  };
  return (
    <div className="bg-white/70 h-screen w-screen flex justify-center items-center">
      <div className="w-1/4 h-auto border p-6 flex items-center justify-center flex-col rounded-lg shadow-lg bg-white">
        <h1 className="text-2xl text-black mb-4">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
          </div>
          <GoogleButton type="Login" handleGoogleLogin={handleSubmit} />
        </form>
      </div>
    </div>
  );
}