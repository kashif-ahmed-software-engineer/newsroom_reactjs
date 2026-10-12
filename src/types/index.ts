export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  status: 'active' | 'inactive';
  permission: number | 0;
  custom_permissions: Record<string, boolean> | null;   // updated: bool not number
  created_at: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  permission_key: string;
  is_granted: boolean;
  created_at: string;
}

export interface RolePermission {
  id: number;
  role_name: string;

  // Story
  can_create_story: boolean;
  can_edit_story_full: boolean;
  can_edit_story_slug: boolean;
  can_delete_story: boolean;
  can_view_story_history: boolean;

  // Rundown
  can_send_to_rundown: boolean;
  can_create_rundown: boolean;
  can_reorder_rundown: boolean;
  can_remove_story_from_rundown: boolean;
  can_delete_rundown: boolean;
  can_edit_rundown_preview_full: boolean;
  can_edit_rundown_preview_slug: boolean;
  can_print_rundown: boolean;
  can_takeover_rundown: boolean;

  // Prompter
  can_use_dash_prompter: boolean;
  can_use_rd_prompter: boolean;

  // Headline bulletin
  can_create_headline_bulletin: boolean;
  can_delete_headline_bulletin: boolean;
  can_edit_headline: boolean;
  can_delete_headline: boolean;
  can_reorder_headline: boolean;
  can_copy_headline: boolean;
  can_assign_headline_to_rundown: boolean;

  // Ticker
  can_edit_ticker: boolean;
  can_delete_ticker: boolean;
  can_set_live_ticker: boolean;

  // Admin
  can_manage_users: boolean;
  can_manage_role_permissions: boolean;

  // Hierarchy
  hierarchy_rank: number;
}

export interface Story {
  id: number;
  slug: string;
  format: string;
  filed_by: string;
  duration: string;
  status: 'red' | 'blue' | 'yellow' | 'green';
  oc_text: string | null;
  template_cg: string | null;
  body_text: string | null;
  notes: string | null;
  lt_id: string | null;
  locked_by: number | null;
  locked_by_name: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  rundown_count: number | 0;
  targetRundown: number | 0;
}

// src/types/index.ts
export interface Rundown {
  id: number;
  sys_num: string;
  name: string;
  scheduled_time: string;
  story_ids: number[];
  status: 'draft' | 'active' | 'archived';
  is_locked: boolean;
  locked_by?: number | null;
  locked_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rundown_Story {
  story_ids: number[];
}

export interface Ticker {
  id: number;
  category: 'breaking' | 'urgent' | 'routine';
  ticker_text: string;
  is_live: boolean;
  created_at: string;
}

export interface DashboardData {
  stories: Story[];
  rundowns: Rundown[];
  tickers: Ticker[];
  users: User[];
  role_permissions: RolePermission[];
  my_permissions: Record<string, number>;
}

export interface StoryHistory {
  id: number;
  story_id: number;
  action: 'INSERT' | 'UPDATE';
  slug: string | null;
  format: string | null;
  filed_by: string | null;
  duration: string | null;
  status: string | null;
  oc_text: string | null;
  template_cg: string | null;
  body_text: string | null;
  notes: string | null;
  locked_by: number | null;
  locked_by_name: string | null;
  created_at: string | null;
  updated_at: string | null;
  changed_by: string | null;
  changed_at: string;
}