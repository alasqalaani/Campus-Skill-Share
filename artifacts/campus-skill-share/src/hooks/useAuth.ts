import { useState, useEffect } from "react";
import { auth, signInWithGoogle } from "../lib/firebase-client";
import { onAuthStateChanged, signOut } from "firebase/auth";

const API_BASE = "";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "student" | "admin";
  displayName: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.sid) {
            localStorage.setItem("sid", data.sid);
          }
          setState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.sid) {
          localStorage.setItem("sid", data.sid);
        }
        setState({ user: data.user, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("sid");
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return { ...state, login, logout };
}
