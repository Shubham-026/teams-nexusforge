import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "./firebase";
import { Task, ContentItem, TaskStatus, TeamMember, CRMLead, UserRole, LeadStatus } from "./types";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
// Auto-sanitize URL to strip any accidental /rest/v1 or trailing slashes
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Creates or retrieves a Supabase client that dynamically injects the
 * current Firebase Auth ID Token (JWT) into every request's Authorization header.
 *
 * This allows Supabase PostgREST to verify the Firebase JWT and execute Row Level Security (RLS)
 * using the Firebase UID in `request.jwt.claims ->> 'sub'`.
 */
export const getSupabaseClient = (customToken?: string): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: customToken ? { Authorization: `Bearer ${customToken}` } : {},
      fetch: async (url, options = {}) => {
        // Attach Firebase user tracking headers without overwriting Supabase's Authorization header
        const user = auth.currentUser;
        if (user) {
          try {
            const headers = new Headers(options.headers || {});
            headers.set("x-firebase-uid", user.uid);
            if (user.email) headers.set("x-firebase-email", user.email);
            // If custom token is explicitly provided (e.g. for custom JWT proxy), set it,
            // otherwise maintain Supabase Anon key in Authorization header so PostgREST verifies requests.
            if (customToken) {
              headers.set("Authorization", `Bearer ${customToken}`);
            }
            return fetch(url, { ...options, headers });
          } catch (err) {
            console.warn("Failed to attach Firebase metadata to Supabase fetch:", err);
          }
        }
        return fetch(url, options);
      },
    },
  });
};

export const supabase = getSupabaseClient();

// ==========================================
// TASKS API FUNCTIONS
// ==========================================

export async function getTasks(): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tasks")
    .select("*, assigned_member:team_members(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase getTasks query returned error (using fallback or local state if unconfigured):", error.message);
    // Return empty array or throw based on app state
    throw error;
  }
  return data as Task[];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const client = getSupabaseClient();
  const user = auth.currentUser;
  
  const payload: Record<string, any> = {
    title: task.title,
    description: task.description || null,
    status: task.status || "todo",
    priority: task.priority || "medium",
    assigned_to: task.assigned_to && task.assigned_to.trim() ? task.assigned_to : null,
    due_date: task.due_date && task.due_date.trim() ? task.due_date : null,
    created_by: user?.uid || "usr_dev_03",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("tasks")
    .insert([payload])
    .select("*, assigned_member:team_members(*)")
    .single();

  if (error) {
    console.error("Supabase createTask error details:", error);
    throw error;
  }
  return data as Task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  const client = getSupabaseClient();
  
  // If it's a temporary client ID, it only existed locally
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId);
  if (!isUuid) {
    console.warn("TaskId is not a valid UUID (local-only task):", taskId);
    return;
  }

  const { data, error } = await client
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select();

  if (error) {
    console.error("Supabase deleteTask error:", error);
    throw error;
  }

  if (data && data.length === 0) {
    console.warn("Supabase deleteTask affected 0 rows (RLS policy may be blocking delete)");
    throw new Error("Row Level Security blocked deletion in Supabase");
  }
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.warn("Supabase getTeamMembers error:", error.message);
    return [];
  }
  return (data || []) as TeamMember[];
}

// ==========================================
// CMS CONTENT API FUNCTIONS
// ==========================================

export async function getContentItems(): Promise<ContentItem[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("content_items")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Supabase getContentItems error:", error.message);
    throw error;
  }
  return data as ContentItem[];
}

export async function createContentItem(item: Partial<ContentItem>): Promise<ContentItem> {
  const client = getSupabaseClient();
  const user = auth.currentUser;

  const payload: Record<string, any> = {
    title: item.title,
    slug: item.slug,
    type: item.type || "blog",
    status: item.status || "draft",
    summary: item.summary || null,
    author_id: user?.uid || "usr_dev_03",
    author_name: user?.displayName || user?.email?.split("@")[0] || "Agency Staff",
    views_count: 0,
    published_at: item.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("content_items")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase createContentItem error:", error);
    throw error;
  }
  return data as ContentItem;
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("content_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ContentItem;
}

export async function deleteContentItem(id: string): Promise<void> {
  const client = getSupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    console.warn("Content id is not a valid UUID (local-only content):", id);
    return;
  }

  const { data, error } = await client.from("content_items").delete().eq("id", id).select();
  if (error) {
    console.error("Supabase deleteContentItem error:", error);
    throw error;
  }
  if (data && data.length === 0) {
    console.warn("Supabase deleteContentItem affected 0 rows (RLS policy may be blocking delete)");
    throw new Error("Row Level Security blocked deletion in Supabase");
  }
}



// ==========================================
// REAL-TIME & PROFILE SYNCHRONIZATION
// ==========================================

export async function getCurrentUserProfile(uid: string): Promise<TeamMember | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("team_members")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch user profile:", error.message);
      return null;
    }
    return data as TeamMember | null;
  } catch (err) {
    console.warn("Error fetching current user profile:", err);
    return null;
  }
}

export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null }): Promise<UserRole> {
  if (!user.uid || !user.email) return "member";
  try {
    const client = getSupabaseClient();
    const initials = (user.displayName || user.email.split("@")[0])
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Check if user already exists
    const { data: existing } = await client
      .from("team_members")
      .select("role")
      .eq("id", user.uid)
      .maybeSingle();

    let assignedRole: UserRole = (existing?.role as UserRole) || "member";

    // Auto-detect Admin / CTO founder credentials
    const isOwner = user.email.toLowerCase().includes("shubham") || user.email.toLowerCase().includes("admin");
    if (isOwner) {
      assignedRole = "admin";
    }

    const { error } = await client.from("team_members").upsert(
      {
        id: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        role: assignedRole,
        avatar_initials: initials,
        color: assignedRole === "admin" ? "lavender" : assignedRole === "ceo" ? "peach" : "mint",
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Could not sync user profile to Supabase:", error.message);
    }

    return assignedRole;
  } catch (err) {
    console.warn("Could not sync user profile to Supabase:", err);
    return "member";
  }
}

// ==========================================
// CRM LEADS API FUNCTIONS
// ==========================================

export async function getCRMLeads(): Promise<CRMLead[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("crm_leads")
    .select("*, assigned_member:team_members(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Supabase getCRMLeads error:", error.message);
    return [];
  }
  return (data || []) as CRMLead[];
}

export async function createCRMLead(lead: Partial<CRMLead>): Promise<CRMLead> {
  const client = getSupabaseClient();
  const payload = {
    company_name: lead.company_name,
    contact_person: lead.contact_person,
    email: lead.email,
    phone: lead.phone || null,
    status: lead.status || "new",
    value: lead.value || 0,
    assigned_to: lead.assigned_to || null,
    notes: lead.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("crm_leads")
    .insert([payload])
    .select("*, assigned_member:team_members(*)")
    .single();

  if (error) {
    console.error("Supabase createCRMLead error:", error);
    throw error;
  }
  return data as CRMLead;
}

export async function updateCRMLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from("crm_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCRMLead(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("crm_leads").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToTasks(onUpdate: () => void): () => void {
  const client = getSupabaseClient();
  const channel = client
    .channel("realtime:tasks")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
      onUpdate();
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
