/**
 * Memory Service
 * Service layer for interacting with the Memoir API
 */

import API_CONFIG from '@/config/api.config';
import type {
  GetSnapshotsByRangeParams,
  SearchSnapshotsParams,
  GetImageParams,
  SnapshotResponse,
  RootResponse,
  HealthResponse,
  UserInfoResponse,
  HTTPValidationError,
} from '@/types/memoir-api.types';

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, API_CONFIG.baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  const finalUrl = url.toString();
  console.log('🌐 Built URL:', finalUrl);
  return finalUrl;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  const url = buildUrl(endpoint, params);
  
  try {
    console.log('🚀 Fetching:', url);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error: HTTPValidationError = await response.json().catch(() => ({
        detail: [{ loc: [], msg: response.statusText, type: 'unknown' }],
      }));
      console.error('⚠️ API error:', error);
      throw new Error(error.detail?.[0]?.msg || response.statusText);
    }

    const data = await response.json();
    console.log('📦 Response data:', data);
    return data;
  } catch (error) {
    console.error('🔥 Fetch error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
}

// ============================================================================
// API Methods
// ============================================================================

export const memoryService = {
  /**
   * Root endpoint with API information
   */
  async getRoot(): Promise<RootResponse> {
    return fetchApi<RootResponse>('/');
  },

  /**
   * Get snapshots within a time range, prioritized by response token count
   */
  async getSnapshotsByRange(
    params: GetSnapshotsByRangeParams
  ): Promise<SnapshotResponse> {
    return fetchApi<SnapshotResponse>('/snapshots/range', params);
  },

  /**
   * Search snapshots using semantic similarity with optional time filtering
   */
  async searchSnapshots(
    params: SearchSnapshotsParams
  ): Promise<SnapshotResponse> {
    return fetchApi<SnapshotResponse>('/snapshots/search', params);
  },

  /**
   * Get image URL for a specific filename
   * Note: This returns the full URL to the image endpoint
   */
  getImageUrl(params: GetImageParams): string {
    return buildUrl(`/images/${params.filename}`);
  },

  /**
   * Fetch image as blob
   */
  async getImage(params: GetImageParams): Promise<Blob> {
    const url = buildUrl(`/images/${params.filename}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    return await response.blob();
  },

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthResponse> {
    return fetchApi<HealthResponse>('/health');
  },

  /**
   * Get user information including oldest snapshot timestamp
   */
  async getUserInfo(): Promise<UserInfoResponse> {
    return fetchApi<UserInfoResponse>('/me');
  },

  /**
   * Search snapshots by goal/priority ID (stubbed)
   * This is a placeholder for future API implementation
   */
  async searchByGoalId(
    goalId: string,
    params?: Omit<SearchSnapshotsParams, 'query'>
  ): Promise<SnapshotResponse> {
    console.log('🎯 Searching by goal ID:', goalId);
    console.log('📋 Additional params:', params);
    
    // TODO: Replace with actual API endpoint when available
    // For now, we'll use the search endpoint with the goal ID as the query
    return this.searchSnapshots({
      query: `goal:${goalId}`,
      k: params?.k || 30,
      threshold: params?.threshold || 0.5,
      include_stats: params?.include_stats,
      include_image: params?.include_image,
    });
  },
};

export default memoryService;

