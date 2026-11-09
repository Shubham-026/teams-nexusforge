export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type UserRole = 'admin' | 'ceo' | 'sales_manager' | 'lead_manager' | 'member';

export interface TeamMember {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  avatar_initials: string;
  color: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_member?: TeamMember | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'blog' | 'portfolio' | 'case_study' | 'landing_copy';
export type ContentStatus = 'draft' | 'in_review' | 'published';

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  status: ContentStatus;
  summary: string | null;
  author_id: string;
  author_name: string;
  views_count: number;
  published_at: string | null;
  updated_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export interface CRMLead {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  value: number;
  assigned_to: string | null;
  assigned_member?: TeamMember | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

