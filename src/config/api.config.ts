/**
 * API Configuration
 * Configure the base URL for the Memoir API
 */

const API_CONFIG = {
  // Base URL for the Memoir API
  // Can be overridden via environment variable
  baseUrl: process.env.NEXT_PUBLIC_MEMOIR_API_URL || 'http://localhost:8000',
} as const;

export default API_CONFIG;

