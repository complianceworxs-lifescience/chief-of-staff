import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { signInWithGoogle, signOutUser, onAuthChange, type FirebaseUser } from "@/lib/firebase";
import type { User } from "@shared/models/auth";

async function verifyTokenWithBackend(idToken: string): Promise<User> {
  const response = await fetch("/api/auth/firebase/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("Token verification failed");
  }

  const data = await response.json();
  return data.user;
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logoutFromBackend(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchUser()
      .then((user) => {
        setUser(user);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const { idToken } = await signInWithGoogle();
      const verifiedUser = await verifyTokenWithBackend(idToken);
      setUser(verifiedUser);
      queryClient.setQueryData(["/api/auth/user"], verifiedUser);
      return verifiedUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await signOutUser();
      await logoutFromBackend();
      setUser(null);
      queryClient.setQueryData(["/api/auth/user"], null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    isLoggingIn,
    isLoggingOut,
  };
}
