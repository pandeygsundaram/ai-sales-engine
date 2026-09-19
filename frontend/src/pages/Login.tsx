import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Shield, Sparkles } from "lucide-react";

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
    setErrorMsg("Email/password sign in is skipped for now. Please sign in with Google below!");
  };

  // Demo fallback in case Google Client ID is not yet provided by the user
  const handleQuickDemoAuth = () => {
    // Generate a valid base64-encoded JWT structure for instant demo access
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: "demo-user-123",
        name: "Sundaram Demo",
        email: "demo@aisalesengine.com",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days valid
      })
    );
    const signature = btoa("demo_signature");
    const demoJwt = `${header}.${payload}.${signature}`;
    loginWithGoogle(demoJwt);
    navigate("/");
  };

  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center mb-2 shadow-lg shadow-emerald-500/10">
            <span className="text-emerald-400 text-lg font-black tracking-tight">AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Sales Engine</h1>
          <p className="text-sm text-zinc-400">Sign in to access your outbound calls and automated sequences</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Email / Password Form (Informative placeholder) */}
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
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-full flex justify-center">
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

            {!hasClientId && (
              <div className="w-full mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="size-3.5" /> Instant Demo Access Available
                </div>
                <p className="text-[11px] text-zinc-400">
                  Once you deploy on Vercel and get your Google Client ID, put it in <code className="text-zinc-200">VITE_GOOGLE_CLIENT_ID</code>. Until then, you can click below to test with a simulated JWT session:
                </p>
                <button
                  type="button"
                  onClick={handleQuickDemoAuth}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-md transition-colors"
                >
                  ⚡ Test Login with Demo Account
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Shield className="size-3.5" /> Secure JWT Session · Protected Endpoints
        </div>
      </div>
    </div>
  );
}
