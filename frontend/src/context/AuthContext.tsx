import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  sub: string;
  exp?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loginWithGoogle: (jwtToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) return null;
    try {
      const decoded: any = jwtDecode(savedToken);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("auth_token");
        return null;
      }
      return {
        name: decoded.name || decoded.email || "User",
        email: decoded.email || "",
        picture: decoded.picture || "",
        sub: decoded.sub || "",
        exp: decoded.exp,
      };
    } catch {
      localStorage.removeItem("auth_token");
      return null;
    }
  });

  const loginWithGoogle = (jwtToken: string) => {
    try {
      const decoded: any = jwtDecode(jwtToken);
      const profile: UserProfile = {
        name: decoded.name || decoded.email || "User",
        email: decoded.email || "",
        picture: decoded.picture || "",
        sub: decoded.sub || "",
        exp: decoded.exp,
      };
      localStorage.setItem("auth_token", jwtToken);
      setToken(jwtToken);
      setUser(profile);
    } catch (err) {
      console.error("Invalid JWT token provided:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
