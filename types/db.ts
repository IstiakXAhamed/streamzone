/**
 * Database row shapes — keep these in sync with the Supabase migration.
 */

export type Role = "user" | "admin" | "superadmin";
export type UserStatus = "pending" | "approved" | "suspended";

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: Role;
  status: UserStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  last_seen: string;
}

export interface MovieRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  duration_seconds: number | null;
  genre: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  drive_file_id: string;
  drive_direct_link: string | null;
  trailer_drive_file_id: string | null;
  rating: number | null;
  featured: boolean;
  views_count: number;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface WatchHistoryRow {
  id: string;
  user_id: string;
  movie_id: string;
  position_seconds: number;
  watched_at: string;
}

export interface WatchPartyRoomRow {
  id: string;
  host_user_id: string;
  movie_id: string;
  is_private: boolean;
  created_at: string;
}

export interface SavedOfflineRow {
  id: string;
  user_id: string;
  movie_id: string;
  saved_at: string;
}

export interface ChatMessageRow {
  id: string;
  room_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface AdminActivityLogRow {
  id: string;
  admin_user_id: string;
  action: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
