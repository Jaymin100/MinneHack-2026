import type { Route } from "./+types/home";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router";
import { useState } from "react";
import logo from "../images/HeartLogo.png";
import logotext from "../images/HeartText.png";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-300 rounded-sm">
            <img src={logo} className="w-8 h-8 rounded-sm" />
          </div>
          <span className="text-lg font-medium tracking-tight">HeartSync</span>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="text-sm border border-neutral-300 px-4 py-2 rounded-md hover:bg-neutral-100 transition disabled:opacity-60"
        >
          Sign in
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-8 pt-24 pb-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Stay close,
              <br />
              even when life gets overwhelming.
            </h1>

            <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-md">
              Burnout, stress, and loneliness is common in college. HeartSync helps you
              stay in touch with friends and family so you know you’re never alone.
            </p>

            <div className="mt-10">
              <button
                onClick={handleLogin}
                className="bg-neutral-900 text-white px-6 py-3 rounded-lg text-base hover:bg-neutral-800 transition"
              >
                {loading ? "Signing in..." : "Continue with Google"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm flex flex-col items-start gap-6 min-h-[16rem]">
            <div className="flex items-center gap-3">
              <img src={logotext} alt="HeartSync" className="w-auto h-100" />
            </div>

            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-neutral-700">Keep relationships alive and don't let them fade away</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-neutral-700">An easy way to remind yourself to check in with friends</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-neutral-700"> Keep track of your mental health and well-being</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
