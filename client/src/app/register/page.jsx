"use client";
import { useState } from "react";
import GoogleButton from "../components/googleButton";
import { API_URL } from "@/constants";

export default function Register() {
  const [role, setRole] = useState("Student"); // Default role is "Student"

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission
    window.location.href = `${API_URL}/auth/register?role=${role}`;
  };

  return (
    <div className="bg-white/70 h-screen w-screen flex justify-center items-center">
      <div className="w-1/4 h-auto border p-6 flex items-center justify-center flex-col rounded-lg shadow-lg bg-white">
        <h1 className="text-2xl text-black mb-4">Register</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-black font-medium">Choose your role:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="Student"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  className="accent-blue-500"
                />
                <span className="text-black">Student</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="Teacher"
                  checked={role === "teacher"}
                  onChange={() => setRole("teacher")}
                  className="accent-blue-500"
                />
                <span className="text-black">Teacher</span>
              </label>
            </div>
          </div>
          <GoogleButton type={"Register"} handleGoogleLogin={handleSubmit} />
        </form>
      </div>
    </div>
  );
}