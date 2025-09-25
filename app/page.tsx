"use client";
import React from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-r from-pink-50 to-purple-100">
      {/* Form bên trái */}
      <div className="flex items-center justify-center p-10">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
            Create Account
          </h2>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="submit"
              className="w-full bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-500 transition"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <a href="#" className="text-pink-500 hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>

      {/* Ảnh bên phải */}
      <div className="hidden md:flex items-center justify-center p-10">
        <div className="text-center">
          <img
            src="/lace.jpg"
            alt="Fashion"
            className="rounded-2xl shadow-lg mb-6"
          />
          <p className="text-lg text-gray-600 italic font-script">
            "Style is a way to say who you are without speaking"
          </p>
        </div>
      </div>
    </div>
  );
}