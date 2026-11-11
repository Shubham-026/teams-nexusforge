import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields (name, email, password, role)" },
        { status: 400 }
      );
    }

    let firebaseUid: string = "";
    let firebaseCreated = false;

    // Strategy A: Firebase Admin SDK
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
        console.warn("admin.createUser failed, falling back to REST API:", adminErr?.message);
      }
    }

    // Strategy B: Identity Toolkit REST API
    if (!firebaseCreated) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Missing NEXT_PUBLIC_FIREBASE_API_KEY" },
          { status: 500 }
        );
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
        return NextResponse.json(
          { error: signUpData.error?.message || "Firebase Auth registration failed" },
          { status: 400 }
        );
      }

      firebaseUid = signUpData.localId;
      const idToken = signUpData.idToken;

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
        } catch (nameErr) {
          console.warn("Failed to set displayName on Firebase user:", nameErr);
        }
      }
    }

    // Sync into Supabase
    const initials =
      name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "NF";

    const client = getSupabaseClient();
    await client.from("team_members").upsert(
      {
        id: firebaseUid,
        name,
        email,
        role,
        avatar_initials: initials,
        color: role === "admin" ? "lavender" : role === "ceo" ? "peach" : "mint",
      },
      { onConflict: "id" }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: firebaseUid,
        name,
        email,
        role,
      },
    });
  } catch (err: any) {
    console.error("API /api/admin/users error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    let fbDeleted = false;
    const admin = getAdminAuth();
    if (admin) {
      try {
        await admin.deleteUser(uid);
        fbDeleted = true;
      } catch (fbErr: any) {
        if (
          email &&
          (fbErr?.code === "auth/user-not-found" ||
            fbErr?.message?.includes("user-not-found"))
        ) {
          try {
            const userRecord = await admin.getUserByEmail(email.trim());
            if (userRecord?.uid) {
              await admin.deleteUser(userRecord.uid);
              fbDeleted = true;
            }
          } catch (byEmailErr: any) {
            console.warn("Delete by email note:", byEmailErr?.message);
          }
        }
      }
    }

    const client = getSupabaseClient();
    let query = client.from("team_members").delete();
    if (email && email.trim()) {
      query = query.or(`id.eq.${uid},email.ilike.${email.trim()}`);
    } else {
      query = query.eq("id", uid);
    }
    await query;

    return NextResponse.json({ success: true, firebaseDeleted: fbDeleted });
  } catch (err: any) {
    console.error("API /api/admin/users delete error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
