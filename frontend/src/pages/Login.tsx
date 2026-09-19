import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Shield } from "lucide-react";

export function Login() {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      // Save the real signed Google ID Token (JWT)
      loginWithGoogle(credentialResponse.credential);
      navigate("/");
    } else {
      setErrorMsg("Google Sign-In was completed, but no credential was returned.");
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Google authentication failed. Please check your credentials or try again.");
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
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="384"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Shield className="size-3.5" /> Secure Google OAuth 2.0 · JWT Session
        </div>
      </div>
    </div>
  );
}
