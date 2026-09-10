"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, api, getToken, removeToken, getCurrentStoredUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  availableUsers: User[];
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const users = await api.getUsers();
      setAvailableUsers(users);
    } catch (e) {
      console.warn("Could not load users list:", e);
    }
  };

  const initAuth = async () => {
    const existingToken = getToken();
    const storedUser = getCurrentStoredUser();
    if (existingToken && storedUser) {
      setToken(existingToken);
      setUser(storedUser);
      // verify token with backend
      try {
        const liveUser = await api.getMe();
        setUser(liveUser);
        fetchUsers();
      } catch (e) {
        // Token expired or server unreachable
        console.warn("Auth check failed:", e);
      }
    } else {
      // Auto-login as Dharun Kumar (SYSTEM ADMIN) with default corporate credentials
      try {
        const res = await api.login("dharunkumar.j@solidpro-es.com", "Welcome@123");
        setUser(res.user);
        setToken(res.access_token);
        fetchUsers();
      } catch (e) {
        console.warn("Default login attempt:", e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string = "Welcome@123") => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.access_token);
      await fetchUsers();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setToken(null);
  };

  const switchUser = async (email: string) => {
    await login(email, "Welcome@123");
  };

  const resetPassword = async (email: string, newPassword: string) => {
    await api.resetPassword(email, newPassword);
  };

  const refreshUserData = async () => {
    if (getToken()) {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchUser,
        resetPassword,
        availableUsers,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
