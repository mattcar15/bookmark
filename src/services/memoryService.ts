/**
 * Memory Service
 * Service layer for interacting with the Memoir API
 */

import API_CONFIG from '@/config/api.config';
import type {
  GetSnapshotsByRangeParams,
  SearchSnapshotsParams,
  UnifiedSearchParams,
  SearchResponse,
  SearchResultItem,
  GetImageParams,
  SnapshotResponse,
  Snapshot,
  RootResponse,
  HealthResponse,
  UserInfoResponse,
  HTTPValidationError,
  SnapshotDetail,
  EpisodeWithSnapshots,
  SimilarResponse,
  DetailViewData,
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
   * Unified hybrid search across snapshots, episodes, and memories.
   * Uses the new /search endpoint with vector similarity and BM25 scoring.
   */
  async search(params: UnifiedSearchParams): Promise<SearchResponse> {
    return fetchApi<SearchResponse>('/search', params);
  },

  /**
   * Search snapshots using the unified search endpoint.
   * This is a compatibility wrapper that converts the old params format
   * to the new unified search and transforms results back to SnapshotResponse.
   */
  async searchSnapshots(
    params: SearchSnapshotsParams
  ): Promise<SnapshotResponse> {
    // Convert old params to new unified search format
    const searchParams: UnifiedSearchParams = {
      q: params.query,
      k: params.k,
      types: 'snapshot', // Only search snapshots for backwards compatibility
    };

    // Convert date strings to unix timestamps if provided
    if (params.start_date) {
      searchParams.start = new Date(params.start_date).getTime();
    }
    if (params.end_date) {
      searchParams.end = new Date(params.end_date).getTime();
    }

    const response = await this.search(searchParams);
    
    // Transform search results to snapshots format
    const snapshots: Snapshot[] = response.results.map((result: SearchResultItem) => ({
      memory_id: result.memory_id,
      snapshot_id: result.snapshot_id,
      episode_id: result.episode_id,
      timestamp: result.timestamp,
      captured_at: result.captured_at,
      title: result.title,
      summary: result.summary,
      bullets: result.bullets,
      tags: result.tags,
      entities: result.entities,
      image_url: result.image_path, // API returns image_path
      window_title: result.window_title,
      url: result.url,
      similarity: result.similarity,
      vector_score: result.vector_score,
      bm25_score: result.bm25_score,
      app: result.app,
    }));

    return {
      snapshots,
      stats: {
        total_snapshots: response.total,
      },
    };
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
   * Search snapshots by goal/priority ID
   * Uses the unified search endpoint with the goal ID as the query
   */
  async searchByGoalId(
    goalId: string,
    params?: Omit<SearchSnapshotsParams, 'query'>
  ): Promise<SnapshotResponse> {
    console.log('🎯 Searching by goal ID:', goalId);
    console.log('📋 Additional params:', params);
    
    return this.searchSnapshots({
      query: `goal:${goalId}`,
      k: params?.k || 30,
      threshold: params?.threshold || 0.3,
      include_stats: params?.include_stats,
      include_image: params?.include_image,
    });
  },

  /**
   * Get full snapshot details by ID
   */
  async getSnapshot(
    snapshotId: string,
    options?: { include_image?: boolean; include_stats?: boolean }
  ): Promise<SnapshotDetail> {
    const params: Record<string, any> = {};
    if (options?.include_image) params.include_image = true;
    if (options?.include_stats) params.include_stats = true;
    
    return fetchApi<SnapshotDetail>(`/snapshots/${snapshotId}`, params);
  },

  /**
   * Get episode with its snapshots
   */
  async getEpisode(episodeId: string): Promise<EpisodeWithSnapshots> {
    return fetchApi<EpisodeWithSnapshots>(`/episodes/${episodeId}`);
  },

  /**
   * Get similar items based on snapshot, memory, or episode ID
   */
  async getSimilar(
    type: 'snapshot' | 'memory' | 'episode',
    id: string,
    k: number = 10,
    threshold?: number
  ): Promise<SimilarResponse> {
    const paramKey = `${type}_id`;
    const params: Record<string, any> = { [paramKey]: id, k };
    if (threshold !== undefined) {
      params.threshold = threshold;
    }
    return fetchApi<SimilarResponse>('/search/similar', params);
  },

  /**
   * Load all detail view data in parallel for a search result
   * This implements the proposed loadSearchResultDetail pattern
   */
  async loadDetailViewData(result: SearchResultItem): Promise<DetailViewData> {
    // 1. Image URL (sync - no fetch needed)
    const imageUrl = result.image_path
      ? this.getImageUrl({ filename: result.image_path.split('/').pop() || '' })
      : null;

    // 2. Full snapshot (if needed beyond search result data)
    const snapshotPromise = result.snapshot_id
      ? this.getSnapshot(result.snapshot_id, { include_image: true, include_stats: true })
          .catch((err) => {
            console.warn('Failed to fetch snapshot details:', err);
            return null;
          })
      : Promise.resolve(null);

    // 3. Episode context (timeline)
    const episodePromise = result.episode_id
      ? this.getEpisode(result.episode_id)
          .catch((err) => {
            console.warn('Failed to fetch episode:', err);
            return null;
          })
      : Promise.resolve(null);

    // 4. Similar items (semantic neighbors) - filter to 40% threshold
    const similarPromise = result.snapshot_id
      ? this.getSimilar('snapshot', result.snapshot_id, 10, 0.4)
          .then((d) => d.similar)
          .catch((err) => {
            console.warn('Failed to fetch similar items:', err);
            return [];
          })
      : Promise.resolve([]);

    // Execute all in parallel
    const [snapshot, episode, similar] = await Promise.all([
      snapshotPromise,
      episodePromise,
      similarPromise,
    ]);

    return { imageUrl, snapshot, episode, similar };
  },
};

export default memoryService;

