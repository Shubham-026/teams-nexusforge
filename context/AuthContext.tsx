"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider, firebaseSignOut } from "@/lib/firebase";
import {
  syncUserProfile,
  getCurrentUserProfile,
  getSupabaseClient,
  getCustomRoles,
  DEFAULT_ROLES,
} from "@/lib/supabase";
import { UserRole, TeamMember, CustomRole } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  teamMember: TeamMember | null;
  role: UserRole;
  customRoles: CustomRole[];
  idToken: string | null;
  loading: boolean;
  isAdmin: boolean;
  isCEO: boolean;
  isSales: boolean;
  isLead: boolean;
  canAccessCMS: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canAccessCRM: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  teamMember: null,
  role: "member",
  customRoles: DEFAULT_ROLES,
  idToken: null,
  loading: true,
  isAdmin: false,
  isCEO: false,
  isSales: false,
  isLead: false,
  canAccessCMS: false,
  canManageUsers: false,
  canManageRoles: false,
  canAccessCRM: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  logout: async () => {},
  getIdToken: async () => null,
  refreshProfile: async () => {},
  refreshRoles: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [role, setRole] = useState<UserRole>("member");
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(DEFAULT_ROLES);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRolesList = async () => {
    try {
      const roles = await getCustomRoles();
      setCustomRoles(roles);
    } catch (err) {
      console.warn("Could not load custom roles:", err);
    }
  };

  useEffect(() => {
    fetchRolesList();
  }, []);

  const fetchProfileAndRole = async (currentUser: User) => {
    try {
      // 1. Sync & retrieve role from Supabase
      const assignedRole = await syncUserProfile(currentUser);
      const profile = await getCurrentUserProfile(currentUser.uid, currentUser.email);
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
    let channel: any = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
          document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          await fetchProfileAndRole(currentUser);

          // Setup real-time listener for live role & profile updates
          const client = getSupabaseClient();
          channel = client
            .channel(`realtime:role_sync:${currentUser.uid}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "team_members",
              },
              (payload: any) => {
                const newRecord = payload.new as TeamMember;
                if (!newRecord) return;
                const matchesUser =
                  newRecord.id === currentUser.uid ||
                  (newRecord.email &&
                    newRecord.email.toLowerCase() ===
                      currentUser.email?.toLowerCase());

                if (matchesUser) {
                  setTeamMember(newRecord);
                  setRole(newRecord.role);
                  document.cookie = `user_role=${newRecord.role}; path=/; max-age=604800; SameSite=Lax`;
                }
              }
            )
            .subscribe();
        } catch (err) {
          console.error("Error retrieving ID token or setting up role sync:", err);
          setIdToken(null);
        }
      } else {
        if (channel) {
          const client = getSupabaseClient();
          client.removeChannel(channel);
        }
        setIdToken(null);
        setTeamMember(null);
        setRole("member");
        document.cookie = "user_role=; path=/; max-age=0";
        document.cookie = "auth_token=; path=/; max-age=0";
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (channel) {
        const client = getSupabaseClient();
        client.removeChannel(channel);
      }
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const token = await res.user.getIdToken();
        setIdToken(token);
        document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        await fetchProfileAndRole(res.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const token = await res.user.getIdToken();
        setIdToken(token);
        document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
        await fetchProfileAndRole(res.user);
      }
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

  // RBAC Dynamic Permission Evaluation
  const isAdmin = role === "admin"; // CTO (Root Admin)
  const isCEO = role === "ceo"; // CEO (Executive)
  const isSales = role === "sales_manager";
  const isLead = role === "lead_manager";

  const currentRole = customRoles.find((r) => r.id === role);

  // Strict constraints enforced per requirements:
  // - CTO (Admin): ALL system access, including Website CMS core technical functionalities.
  // - CEO: ALL system access, EXCEPT core technical functionalities (Website CMS).
  // - Role Management (add/delete/customise access): Strictly CEO & CTO only.
  // - Other roles: dynamically evaluate customized permissions stored in database.
  const canAccessCMS = isAdmin;
  const canManageRoles = isAdmin || isCEO;
  const canManageUsers =
    isAdmin || isCEO || Boolean(currentRole?.can_manage_team);
  const canAccessCRM =
    isAdmin ||
    isCEO ||
    isSales ||
    isLead ||
    Boolean(currentRole?.can_access_crm);

  return (
    <AuthContext.Provider
      value={{
        user,
        teamMember,
        role,
        customRoles,
        idToken,
        loading,
        isAdmin,
        isCEO,
        isSales,
        isLead,
        canAccessCMS,
        canManageUsers,
        canManageRoles,
        canAccessCRM,
        signInWithGoogle,
        signInWithEmail,
        logout,
        getIdToken,
        refreshProfile,
        refreshRoles: fetchRolesList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
