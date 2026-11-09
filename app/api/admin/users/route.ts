import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
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

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // Sync into Supabase
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NF";

    const client = getSupabaseClient();
    await client.from("team_members").upsert(
      {
        id: userRecord.uid,
        name,
        email,
        role,
        avatar_initials: initials,
        color: role === "admin" ? "lavender" : "mint",
      },
      { onConflict: "id" }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
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

    if (!uid) {
      return NextResponse.json({ error: "Missing uid parameter" }, { status: 400 });
    }

    try {
      await adminAuth.deleteUser(uid);
    } catch (fbErr: any) {
      console.warn("Firebase deleteUser note:", fbErr?.message);
    }

    const client = getSupabaseClient();
    await client.from("team_members").delete().eq("id", uid);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API /api/admin/users delete error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

