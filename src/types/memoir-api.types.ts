/**
 * TypeScript types generated from Memoir API OpenAPI specification
 */

// ============================================================================
// Error Types
// ============================================================================

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

// ============================================================================
// Snapshot Types
// ============================================================================

export interface Snapshot {
  snapshot_id?: string;
  memory_id?: string;
  episode_id?: string | null;
  timestamp?: string;
  captured_at?: number;
  app?: string;
  url?: string | null;
  window_title?: string;
  title?: string;
  summary?: string;
  bullets?: string[];
  tags?: string[];
  entities?: string[];
  image_url?: string;
  similarity?: number;
  vector_score?: number;
  bm25_score?: number;
  stats?: {
    [key: string]: any;
  };
  [key: string]: any; // Allow additional properties
}

export interface SnapshotStats {
  total_snapshots?: number;
  total_tokens?: number;
  time_range?: {
    start: string;
    end: string;
  };
  [key: string]: any; // Allow additional properties
}

export interface SnapshotResponse {
  snapshots: Snapshot[];
  stats?: SnapshotStats;
}

// ============================================================================
// Request Parameter Types
// ============================================================================

export interface GetSnapshotsByRangeParams {
  start_date: string; // ISO format (e.g., 2025-10-10T00:00:00)
  end_date: string; // ISO format (e.g., 2025-10-10T23:59:59)
  k?: number; // Maximum number of snapshots to return (1-100, default: 30)
  include_stats?: boolean; // Include stats in response (default: false)
  include_image?: boolean; // Include image URL in response (default: false)
}

export interface SearchSnapshotsParams {
  query: string; // Search query text
  k?: number; // Maximum number of snapshots to return (1-100, default: 30)
  threshold?: number; // Minimum similarity threshold (0-1, default: 0.5)
  start_date?: string | null; // Optional start date filter in ISO format
  end_date?: string | null; // Optional end date filter in ISO format
  include_stats?: boolean; // Include stats in response (default: false)
  include_image?: boolean; // Include image URL in response (default: false)
}

// ============================================================================
// Unified Search Types
// ============================================================================

export interface UnifiedSearchParams {
  q: string; // Search query text (required)
  k?: number; // Maximum number of results (1-100, default: 30)
  types?: string; // Comma-separated entity types: snapshot,episode,memory
  app?: string; // Filter by app name
  start?: number; // Filter by start time (unix ms)
  end?: number; // Filter by end time (unix ms)
  vector_weight?: number; // Weight for vector similarity score (0-1, default: 0.6)
  bm25_weight?: number; // Weight for BM25 keyword score (0-1, default: 0.4)
}

export interface SearchResultItem {
  snapshot_id?: string;
  memory_id?: string;
  episode_id?: string | null;
  timestamp?: string;
  captured_at?: number;
  app?: string;
  url?: string | null;
  window_title?: string;
  image_path?: string;
  title?: string;
  summary?: string;
  bullets?: string[];
  tags?: string[];
  entities?: string[];
  similarity?: number; // Blended score
  vector_score?: number;
  bm25_score?: number;
  [key: string]: any; // Allow additional properties
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
}

export interface GetImageParams {
  filename: string; // Image filename
}

// ============================================================================
// Response Types
// ============================================================================

export interface RootResponse {
  message?: string;
  version?: string;
  [key: string]: any;
}

export interface HealthResponse {
  status?: string;
  [key: string]: any;
}

export interface UserInfoResponse {
  total_snapshots: number;
  oldest_snapshot: string | null; // ISO timestamp
}

// ============================================================================
// Detail View Types
// ============================================================================

export interface SnapshotDetail {
  snapshot_id: string;
  memory_id?: string;
  episode_id?: string | null;
  timestamp?: string;
  captured_at?: number;
  app?: string;
  url?: string | null;
  window_title?: string;
  title?: string;
  summary?: string;
  bullets?: string[];
  tags?: string[];
  entities?: string[];
  image_path?: string;
  image_url?: string;
  stats?: {
    [key: string]: any;
  };
  [key: string]: any;
}

export interface EpisodeSnapshot {
  snapshot_id: string;
  timestamp?: string;
  captured_at?: number;
  title?: string;
  summary?: string;
  app?: string;
  image_path?: string;
}

export interface EpisodeWithSnapshots {
  episode_id: string;
  title?: string;
  summary?: string;
  start_time?: string;
  end_time?: string;
  app?: string;
  snapshots: EpisodeSnapshot[];
}

export interface SimilarItem {
  snapshot_id?: string;
  memory_id?: string;
  episode_id?: string | null;
  timestamp?: string;
  title?: string;
  summary?: string;
  image_path?: string;
  app?: string;
  similarity?: number;
}

export interface SimilarResponse {
  similar: SimilarItem[];
  query_id: string;
  k: number;
}

export interface DetailViewData {
  imageUrl: string | null;
  snapshot: SnapshotDetail | null;
  episode: EpisodeWithSnapshots | null;
  similar: SimilarItem[];
}

