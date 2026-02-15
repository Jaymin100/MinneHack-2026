import type { Route } from "./+types/home";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    await signInWithPopup(auth, provider);
    navigate("/dashboard");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <span className="font-semibold">HeartSync</span>
          <button type="button" onClick={login} disabled={loading} className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Mood + check-ins</h1>
        <p className="mt-2 text-gray-600 text-sm">
          Log how you feel and get reminded to reach out to people. For college.
        </p>
        <button
          type="button"
          onClick={login}
          disabled={loading}
          className="mt-6 bg-gray-800 text-white text-sm px-4 py-2 rounded"
        >
          {loading ? "..." : "Continue with Google"}
        </button>
      </main>
    </div>
  );
}
