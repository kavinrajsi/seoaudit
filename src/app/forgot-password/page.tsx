"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage("Check your email for password reset instructions.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md w-full max-w-sm">
        <h1 className="mb-4 text-2xl font-bold text-center">Forgot Password</h1>
        {errorMsg && <p className="mb-4 text-red-600">{errorMsg}</p>}
        {message && <p className="mb-4 text-green-600">{message}</p>}
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full py-2 text-white bg-yellow-600 rounded hover:bg-yellow-700">
          Reset Password
        </button>
        <div className="flex justify-center text-sm mt-4">
          <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
        </div>
      </form>
    </div>
  );
}
