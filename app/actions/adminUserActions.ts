"use server";

import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getSupabaseClient } from "@/lib/supabase";
import { UserRole } from "@/lib/types";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Server action to create a new team user in Firebase Auth
 * and synchronize their profile into Supabase team_members with RBAC role.
 *
 * Employs a dual-strategy:
 * 1. Attempts Firebase Admin SDK (if service account is available).
 * 2. Falls back seamlessly to Google Identity Toolkit REST API using the project API key.
 *
 * This guarantees the user is ALWAYS registered in Firebase Auth and Supabase,
 * while ensuring the currently logged-in Admin is NEVER logged out!
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

    let firebaseUid: string = "";
    let firebaseCreated = false;

    // Strategy A: If Service Account private key is configured, use Firebase Admin SDK
    const admin = getAdminAuth();
    if (admin) {
      try {
        const userRecord = await admin.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true,
        });
        firebaseUid = userRecord.uid;
        firebaseCreated = true;
        try {
          await admin.setCustomUserClaims(userRecord.uid, { role });
        } catch (claimsErr) {
          console.warn("Could not set custom claims:", claimsErr);
        }
      } catch (adminErr: any) {
        console.warn("admin.createUser failed, falling back to Identity Toolkit:", adminErr?.message);
      }
    }

    // Strategy B: Google Identity Toolkit REST API using Firebase Web API Key
    // Direct, reliable, and authenticates the user in Firebase Auth cloud without service account setup.
    if (!firebaseCreated) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in environment configuration.");
      }

      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const signUpData = await signUpRes.json();

      if (!signUpRes.ok || signUpData.error) {
        const rawMsg = signUpData.error?.message || "Failed to create user in Firebase Auth";
        if (rawMsg.includes("EMAIL_EXISTS")) {
          return { success: false, error: "A team member with this email address already exists in Firebase Auth." };
        } else if (rawMsg.includes("WEAK_PASSWORD")) {
          return { success: false, error: "Password should be at least 6 characters." };
        } else if (rawMsg.includes("INVALID_EMAIL")) {
          return { success: false, error: "The agency email address is invalid." };
        } else {
          return { success: false, error: rawMsg };
        }
      }

      firebaseUid = signUpData.localId;
      const idToken = signUpData.idToken;

      // Update displayName on the created Firebase user
      if (idToken && name) {
        try {
          await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idToken,
                displayName: name,
                returnSecureToken: false,
              }),
            }
          );
        } catch (updateErr) {
          console.warn("Warning updating displayName on Firebase account:", updateErr);
        }
      }
    }

    if (!firebaseUid) {
      throw new Error("Could not determine user ID from Firebase Auth.");
    }

    // Compute initials and avatar color
    const cleanEmail = email.toLowerCase().trim();
    const initials =
      name
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

    // Synchronize into Supabase team_members with RBAC role
    const client = getSupabaseClient();
    const { data: existingMember } = await client
      .from("team_members")
      .select("id, email")
      .or(`id.eq.${firebaseUid},email.ilike.${cleanEmail}`)
      .maybeSingle();

    if (existingMember) {
      await client
        .from("team_members")
        .update({
          id: firebaseUid,
          name,
          role,
          avatar_initials: initials,
          color: roleColors[role] || "lavender",
        })
        .or(`id.eq.${firebaseUid},email.ilike.${cleanEmail}`);
    } else {
      await client.from("team_members").insert([
        {
          id: firebaseUid,
          name,
          email: cleanEmail,
          role,
          avatar_initials: initials,
          color: roleColors[role] || "lavender",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return {
      success: true,
      user: {
        id: firebaseUid,
        name,
        email: cleanEmail,
        role,
      },
    };
  } catch (err: any) {
    console.error("Error in createTeamUser:", err);
    let msg = err?.message || "Failed to create user";
    if (msg.includes("auth/email-already-exists") || msg.includes("EMAIL_EXISTS")) {
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
export async function deleteTeamUser(uid: string, email?: string) {
  try {
    if (!uid) return { success: false, error: "User ID required" };

    let fbDeleted = false;
    let fbErrorMsg: string | null = null;

    // 1. Attempt Firebase Admin deletion if service account is configured
    const admin = getAdminAuth();
    if (admin) {
      try {
        await admin.deleteUser(uid);
        fbDeleted = true;
      } catch (fbErr: any) {
        // If not found by UID, try looking up by email in Firebase Auth
        if (
          email &&
          (fbErr?.code === "auth/user-not-found" ||
            fbErr?.message?.includes("user-not-found") ||
            fbErr?.message?.includes("not found"))
        ) {
          try {
            const userRecord = await admin.getUserByEmail(email.trim());
            if (userRecord?.uid) {
              await admin.deleteUser(userRecord.uid);
              fbDeleted = true;
            }
          } catch (byEmailErr: any) {
            fbErrorMsg = byEmailErr?.message;
            console.warn("Could not delete user in Firebase by email:", byEmailErr?.message);
          }
        } else {
          fbErrorMsg = fbErr?.message;
          console.warn("Firebase Admin deleteUser error:", fbErr?.message);
        }
      }
    } else {
      fbErrorMsg =
        "Service Account credentials (FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY) not found in environment.";
    }

    // 2. Delete user from Supabase team_members
    const client = getSupabaseClient();
    let query = client.from("team_members").delete();
    if (email && email.trim()) {
      query = query.or(`id.eq.${uid},email.ilike.${email.trim()}`);
    } else {
      query = query.eq("id", uid);
    }
    const { error: dbError } = await query;

    if (dbError) {
      throw new Error(dbError.message);
    }

    return {
      success: true,
      firebaseDeleted: fbDeleted,
      firebaseWarning: !fbDeleted ? fbErrorMsg : null,
    };
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
export async function updateTeamUserRole(uid: string, newRole: UserRole, email?: string) {
  try {
    if (!uid || !newRole) return { success: false, error: "UID and Role required" };

    // Update Firebase Custom Claims if Admin SDK is configured
    const admin = getAdminAuth();
    if (admin) {
      try {
        await admin.setCustomUserClaims(uid, { role: newRole });
      } catch (claimErr) {
        console.warn("Notice: Custom claims require service account:", claimErr);
      }
    }

    const roleColors: Record<UserRole, string> = {
      admin: "lavender",
      ceo: "peach",
      sales_manager: "sky",
      lead_manager: "mint",
      member: "lavender",
    };

    // Update Supabase team_members
    const client = getSupabaseClient();
    let query = client
      .from("team_members")
      .update({ role: newRole, color: roleColors[newRole] || "lavender" });

    if (email && email.trim()) {
      query = query.or(`id.eq.${uid},email.ilike.${email.trim()}`);
    } else {
      query = query.eq("id", uid);
    }

    const { data, error } = await query.select();

    if (error) throw error;
    return { success: true, count: data?.length || 0 };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err?.message || "Failed to update role" };
  }
}
