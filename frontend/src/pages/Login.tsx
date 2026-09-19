import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Shield } from "lucide-react";

export function Login() {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check for backend redirect with ?token= or ?error=
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      loginWithGoogle(token);
      navigate("/", { replace: true });
    } else if (error) {
      setErrorMsg(`Authentication failed (${error}). Please try again.`);
    }
  }, [searchParams, loginWithGoogle, navigate]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("Email/password sign-in is disabled. Please continue with Google.");
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-white">Sales Engine</h1>
          <p className="text-sm text-zinc-400">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
            >
              Sign In with Email
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-950 px-3 text-xs text-zinc-500 uppercase tracking-wider absolute">
              or continue with
            </span>
          </div>

          {/* Google OAuth Section */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-lg border border-zinc-700 flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Shield className="size-3.5" /> Secure Google OAuth 2.0 · JWT Session
        </div>
      </div>
    </div>
  );
}
