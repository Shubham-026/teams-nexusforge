"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider, firebaseSignOut } from "@/lib/firebase";
import { syncUserProfile, getCurrentUserProfile } from "@/lib/supabase";
import { UserRole, TeamMember } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  teamMember: TeamMember | null;
  role: UserRole;
  idToken: string | null;
  loading: boolean;
  isAdmin: boolean;
  isCEO: boolean;
  isSales: boolean;
  isLead: boolean;
  canAccessCMS: boolean;
  canManageUsers: boolean;
  canAccessCRM: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  teamMember: null,
  role: "member",
  idToken: null,
  loading: true,
  isAdmin: false,
  isCEO: false,
  isSales: false,
  isLead: false,
  canAccessCMS: false,
  canManageUsers: false,
  canAccessCRM: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [role, setRole] = useState<UserRole>("member");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileAndRole = async (currentUser: User) => {
    try {
      // 1. Sync & retrieve role from Supabase
      const assignedRole = await syncUserProfile(currentUser);
      const profile = await getCurrentUserProfile(currentUser.uid);
      if (profile) {
        setTeamMember(profile);
        setRole(profile.role);
        // Set cookie so Next.js middleware can inspect roles
        document.cookie = `user_role=${profile.role}; path=/; max-age=604800; SameSite=Lax`;
      } else {
        setRole(assignedRole);
        document.cookie = `user_role=${assignedRole}; path=/; max-age=604800; SameSite=Lax`;
      }
    } catch (err) {
      console.warn("Error fetching user profile & role:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          await fetchProfileAndRole(currentUser);
        } catch (err) {
          console.error("Error retrieving ID token:", err);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
        setTeamMember(null);
        setRole("member");
        document.cookie = "user_role=; path=/; max-age=0";
        document.cookie = "auth_token=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setTeamMember(null);
    setRole("member");
    setIdToken(null);
    document.cookie = "user_role=; path=/; max-age=0";
    document.cookie = "auth_token=; path=/; max-age=0";
  };

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    const token = await auth.currentUser.getIdToken(true);
    setIdToken(token);
    return token;
  };

  // RBAC Permission Helpers
  const isAdmin = role === "admin";
  const isCEO = role === "ceo";
  const isSales = role === "sales_manager";
  const isLead = role === "lead_manager";

  // Strict constraints:
  // - CMS: Admin/CTO exclusive
  // - Team Management: Admin/CTO exclusive
  // - CRM Leads: Admin, CEO, Sales Manager
  const canAccessCMS = isAdmin;
  const canManageUsers = isAdmin;
  const canAccessCRM = isAdmin || isCEO || isSales;

  return (
    <AuthContext.Provider
      value={{
        user,
        teamMember,
        role,
        idToken,
        loading,
        isAdmin,
        isCEO,
        isSales,
        isLead,
        canAccessCMS,
        canManageUsers,
        canAccessCRM,
        signInWithGoogle,
        signInWithEmail,
        logout,
        getIdToken,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
