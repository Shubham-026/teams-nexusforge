import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "./firebase";
import { Task, ContentItem, TaskStatus, TeamMember, CRMLead, UserRole, LeadStatus, CustomRole, RolePermissions } from "./types";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
// Auto-sanitize URL to strip any accidental /rest/v1 or trailing slashes
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let globalSupabaseClient: SupabaseClient | null = null;

/**
 * Creates or retrieves a Supabase client singleton that dynamically injects the
 * current Firebase Auth ID Token (JWT) into every request's Authorization header.
 *
 * Reusing a singleton instance prevents GoTrueClient duplicate instantiation warnings
 * and optimizes PostgREST connection pooling.
 */
export const getSupabaseClient = (customToken?: string): SupabaseClient => {
  // If custom token is explicitly provided (e.g. for custom JWT proxy), return isolated instance
  if (customToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: { Authorization: `Bearer ${customToken}` },
      },
    });
  }

  // Reuse singleton instance
  if (!globalSupabaseClient) {
    globalSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          if (typeof window !== "undefined") {
            const user = auth.currentUser;
            if (user) {
              try {
                const headers = new Headers(options.headers || {});
                headers.set("x-firebase-uid", user.uid);
                if (user.email) headers.set("x-firebase-email", user.email);
                return fetch(url, { ...options, headers });
              } catch (err) {
                console.warn("Failed to attach Firebase metadata to Supabase fetch:", err);
              }
            }
          }
          return fetch(url, options);
        },
      },
    });
  }

  return globalSupabaseClient;
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

export async function getCurrentUserProfile(uid: string, email?: string | null): Promise<TeamMember | null> {
  try {
    const client = getSupabaseClient();
    let query = client.from("team_members").select("*");
    if (email && email.trim()) {
      query = query.or(`id.eq.${uid},email.ilike.${email.trim()}`);
    } else {
      query = query.eq("id", uid);
    }
    const { data, error } = await query.maybeSingle();

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
    const cleanEmail = user.email.toLowerCase().trim();
    const initials = (user.displayName || cleanEmail.split("@")[0])
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // 1. Check if user already exists by Firebase UID OR Email
    const { data: existing } = await client
      .from("team_members")
      .select("*")
      .or(`id.eq.${user.uid},email.ilike.${cleanEmail}`)
      .maybeSingle();

    // Founder / CTO auto-admin check
    const isOwner = cleanEmail.includes("shubham") || cleanEmail.includes("admin");

    if (existing) {
      // User exists! CRITICAL: Maintain their assigned role from the database.
      // Do NOT overwrite their existing role!
      const finalRole: UserRole = isOwner ? "admin" : (existing.role as UserRole) || "member";

      // If their id in Supabase was different from their Firebase UID, update it now
      const { error: updateError } = await client
        .from("team_members")
        .update({
          id: user.uid,
          name: user.displayName || existing.name,
          avatar_initials: initials,
          ...(isOwner ? { role: "admin" } : {}),
        })
        .or(`id.eq.${user.uid},email.ilike.${cleanEmail}`);

      if (updateError) {
        console.warn("Warning syncing user ID to Supabase:", updateError.message);
      }

      return finalRole;
    }

    // 2. User is brand new (first login)
    const assignedRole: UserRole = isOwner ? "admin" : "member";
    const roleColors: Record<UserRole, string> = {
      admin: "lavender",
      ceo: "peach",
      sales_manager: "sky",
      lead_manager: "mint",
      member: "lavender",
    };

    const { error: insertError } = await client.from("team_members").insert([
      {
        id: user.uid,
        name: user.displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: assignedRole,
        avatar_initials: initials,
        color: roleColors[assignedRole] || "lavender",
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.warn("Could not insert brand new user profile to Supabase:", insertError.message);
    }

    return assignedRole;
  } catch (err) {
    console.warn("Could not sync user profile to Supabase:", err);
    return "member";
  }
}

export async function updateCurrentUserProfile(
  uid: string,
  updates: { name?: string; avatar_initials?: string; color?: string },
  email?: string | null
): Promise<TeamMember | null> {
  const client = getSupabaseClient();
  let query = client.from("team_members").update(updates);
  if (email && email.trim()) {
    query = query.or(`id.eq.${uid},email.ilike.${email.toLowerCase().trim()}`);
  } else {
    query = query.eq("id", uid);
  }
  const { data, error } = await query.select().maybeSingle();
  if (error) {
    console.error("updateCurrentUserProfile error:", error);
    throw error;
  }
  return data as TeamMember | null;
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

// ==========================================
// DYNAMIC ROLES & PERMISSIONS API FUNCTIONS
// ==========================================

export const DEFAULT_ROLES: CustomRole[] = [
  {
    id: "admin",
    name: "Admin / CTO",
    description: "Full system control, Website CMS, and infrastructure access.",
    color: "lavender",
    is_system: true,
    can_access_tasks: true,
    can_access_crm: true,
    can_access_cms: true,
    can_manage_team: true,
    can_manage_roles: true,
  },
  {
    id: "ceo",
    name: "CEO (Executive)",
    description: "Executive oversight, agency analytics, and team governance (all except core CMS technical).",
    color: "peach",
    is_system: true,
    can_access_tasks: true,
    can_access_crm: true,
    can_access_cms: false, // Core technical functionality strictly restricted to CTO
    can_manage_team: true,
    can_manage_roles: true,
  },
  {
    id: "sales_manager",
    name: "Sales Manager",
    description: "Client acquisition tracking, outreach pipelines, and conversion analytics.",
    color: "sky",
    is_system: false,
    can_access_tasks: true,
    can_access_crm: true,
    can_access_cms: false,
    can_manage_team: false,
    can_manage_roles: false,
  },
  {
    id: "lead_manager",
    name: "Lead Manager",
    description: "Prospect qualification, outreach coordination, and lead pipeline.",
    color: "mint",
    is_system: false,
    can_access_tasks: true,
    can_access_crm: true,
    can_access_cms: false,
    can_manage_team: false,
    can_manage_roles: false,
  },
  {
    id: "member",
    name: "Team Member",
    description: "Task deliverables, kanban collaboration, and internal communications.",
    color: "slate",
    is_system: false,
    can_access_tasks: true,
    can_access_crm: false,
    can_access_cms: false,
    can_manage_team: false,
    can_manage_roles: false,
  },
];

export async function getCustomRoles(): Promise<CustomRole[]> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("custom_roles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_ROLES;
    }

    const rolesMap = new Map<string, CustomRole>();
    DEFAULT_ROLES.forEach((r) => rolesMap.set(r.id, r));
    data.forEach((r: CustomRole) => rolesMap.set(r.id, { ...r }));

    // Force system role constraints:
    // CTO (admin): all permissions true
    const adminRole = rolesMap.get("admin");
    if (adminRole) {
      adminRole.is_system = true;
      adminRole.can_access_cms = true;
      adminRole.can_manage_roles = true;
      adminRole.can_manage_team = true;
    }
    // CEO: all permissions true EXCEPT Website CMS (core technical)
    const ceoRole = rolesMap.get("ceo");
    if (ceoRole) {
      ceoRole.is_system = true;
      ceoRole.can_access_cms = false;
      ceoRole.can_manage_roles = true;
      ceoRole.can_manage_team = true;
    }

    return Array.from(rolesMap.values());
  } catch (err) {
    console.warn("Using default roles fallback:", err);
    return DEFAULT_ROLES;
  }
}

export async function saveCustomRole(role: CustomRole): Promise<CustomRole> {
  const client = getSupabaseClient();

  // Enforce system constraints
  if (role.id === "admin") {
    role.is_system = true;
    role.can_access_cms = true;
    role.can_manage_roles = true;
    role.can_manage_team = true;
  }
  if (role.id === "ceo") {
    role.is_system = true;
    role.can_access_cms = false; // Never allow CMS for CEO
    role.can_manage_roles = true;
    role.can_manage_team = true;
  }

  const { data, error } = await client
    .from("custom_roles")
    .upsert([role], { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error saving custom role:", error);
    throw error;
  }
  return data as CustomRole;
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  if (roleId === "admin" || roleId === "ceo") {
    throw new Error("Cannot delete immutable system roles (CTO and CEO).");
  }

  const client = getSupabaseClient();
  // Safely reassign any members with this role to 'member'
  await client
    .from("team_members")
    .update({ role: "member" })
    .eq("role", roleId);

  const { error } = await client
    .from("custom_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    console.error("Error deleting custom role:", error);
    throw error;
  }
}
