"use server";

import { adminAuth } from "@/lib/firebaseAdmin";
import { getSupabaseClient } from "@/lib/supabase";
import { UserRole } from "@/lib/types";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Server action to create a new team user via Firebase Admin SDK
 * and synchronize their profile into Supabase team_members with RBAC role.
 * 
 * Crucial advantage: Operates entirely on the server so the currently
 * authenticated Admin is NEVER logged out!
 */
export async function createTeamUser(input: CreateUserInput) {
  try {
    const { name, email, password, role } = input;
    if (!email || !password || !name) {
      return { success: false, error: "Name, email, and password are required." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // 1. Create user in Firebase Auth using Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // 2. Set Firebase Custom User Claims for verified RBAC in ID Tokens
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Compute initials and avatar color
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NF";

    const roleColors: Record<UserRole, string> = {
      admin: "lavender",
      ceo: "peach",
      sales_manager: "sky",
      lead_manager: "mint",
      member: "lavender",
    };

    // 4. Insert into Supabase team_members
    const client = getSupabaseClient();
    const { error: dbError } = await client.from("team_members").upsert(
      {
        id: userRecord.uid,
        name,
        email,
        role,
        avatar_initials: initials,
        color: roleColors[role] || "lavender",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (dbError) {
      console.warn("User created in Firebase Auth, but Supabase insert had warning:", dbError.message);
    }

    return {
      success: true,
      user: {
        id: userRecord.uid,
        name,
        email,
        role,
      },
    };
  } catch (err: any) {
    console.error("Error creating team user via Firebase Admin:", err);
    let msg = err?.message || "Failed to create user with Firebase Admin SDK";
    if (msg.includes("auth/email-already-exists")) {
      msg = "A team member with this email address already exists.";
    }
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Server action to delete a team user from both Firebase Auth and Supabase
 */
export async function deleteTeamUser(uid: string) {
  try {
    if (!uid) return { success: false, error: "User ID required" };

    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (fbErr: any) {
      console.warn("Firebase Admin deleteUser note:", fbErr?.message);
    }

    // 2. Delete from Supabase team_members
    const client = getSupabaseClient();
    const { error: dbError } = await client
      .from("team_members")
      .delete()
      .eq("id", uid);

    if (dbError) {
      throw new Error(dbError.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error deleting team user:", err);
    return {
      success: false,
      error: err?.message || "Failed to delete user",
    };
  }
}

/**
 * Server action to update a team user's role
 */
export async function updateTeamUserRole(uid: string, newRole: UserRole) {
  try {
    if (!uid || !newRole) return { success: false, error: "UID and Role required" };

    // 1. Update Firebase Custom Claims
    await adminAuth.setCustomUserClaims(uid, { role: newRole });

    // 2. Update Supabase team_members
    const client = getSupabaseClient();
    const { error } = await client
      .from("team_members")
      .update({ role: newRole })
      .eq("id", uid);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err?.message || "Failed to update role" };
  }
}

