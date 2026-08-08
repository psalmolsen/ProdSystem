import React, { createContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  onAuthStateChanged,
  checkRedirectResult,
} from "@/firebase/auth";
import { createAccessRequest } from "@/services/firestore/accessRequestService";
import { getCurrentUserRole } from "@/services/firestore/userService";

export interface AuthContextType {
  user: User | null;
  isApproved: boolean;
  role: string | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Process redirect result for mobile browsers returning from Google auth
    checkRedirectResult().catch((err) => {
      console.warn("Auth redirect result error:", err);
    });

    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // 1. Check if user document exists in users/{email} or users/{uid}
          const fetchedRole = await getCurrentUserRole(currentUser);
          if (fetchedRole) {
            setIsApproved(true);
            setRole(fetchedRole);
          } else {
            setIsApproved(false);
            setRole(null);
            // 2. Create access request in accessRequests/{uid} if missing
            await createAccessRequest(currentUser);
          }
        } catch (err: any) {
          console.error("Error checking Firestore user status:", err);
          setIsApproved(false);
          setRole(null);
        }
      } else {
        setIsApproved(false);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      await authSignIn();
    } catch (err: any) {
      console.error("Google Authentication error:", err);
      let message = "Failed to sign in with Google. Please try again.";
      if (err?.code === "auth/popup-closed-by-user") {
        message = "Sign-in popup was closed before completing authentication.";
      } else if (err?.code === "auth/popup-blocked") {
        message =
          "Sign-in popup was blocked by your browser. Please allow popups for this domain.";
      } else if (err?.code === "auth/network-request-failed") {
        message =
          "Network error occurred. Please check your internet connection.";
      } else if (err?.message) {
        message = err.message;
      }
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await authSignOut();
      setUser(null);
      setIsApproved(false);
      setRole(null);
    } catch (err: any) {
      console.error("Sign out error:", err);
      setError(err?.message || "Failed to sign out.");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, isApproved, role, loading, error, signIn, signOut, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

