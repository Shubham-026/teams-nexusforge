export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeamMember {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: string;
  avatar_initials: string;
  color: string;
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

