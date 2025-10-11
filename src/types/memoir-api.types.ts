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
  memory_id?: string;
  timestamp?: string;
  summary?: string;
  image_url?: string;
  similarity?: number;
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

