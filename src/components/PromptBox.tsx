'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import memoryService from '@/services/memoryService';
import type { Snapshot } from '@/types/memoir-api.types';
import SearchPill from './SearchPill';

interface PromptBoxProps {
  onSearchResults: (snapshots: Snapshot[], query: string) => void;
  onSearchStart: () => void;
  isLoading: boolean;
  activePriorityFilter?: { id: string; title: string } | null;
  onRemovePriorityFilter?: () => void;
}

export default function PromptBox({ 
  onSearchResults, 
  onSearchStart, 
  isLoading,
  activePriorityFilter,
  onRemovePriorityFilter,
}: PromptBoxProps) {
  const [query, setQuery] = useState('');
  const prevQueryRef = useRef(query);

  // Clear search results when the query is cleared
  useEffect(() => {
    // If query was non-empty and is now empty, clear results
    if (prevQueryRef.current.trim().length > 0 && query.trim().length === 0) {
      console.log('🧹 Query cleared, clearing search results');
      onSearchResults([], '');
    }
    prevQueryRef.current = query;
  }, [query, onSearchResults]);

  const canSearch = query.trim().length > 0 && !isLoading;

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    console.log('🔍 Starting search for:', query.trim());
    onSearchStart();
    
    try {
      console.log('📡 Calling Memoir API...');
      const response = await memoryService.searchSnapshots({
        query: query.trim(),
        k: 30,
        threshold: 0.3,
        include_stats: true,
        include_image: true,
      });
      
      console.log('✅ Search response:', response);
      console.log('📊 Snapshots received:', response.snapshots?.length || 0);
      onSearchResults(response.snapshots || [], query);
    } catch (error) {
      console.error('❌ Search failed:', error);
      onSearchResults([], query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-muted/50 rounded-xl px-4 py-3 border border-border flex flex-col gap-2">
          {/* Active Priority Filter Pill - inside card, above input */}
          {activePriorityFilter && onRemovePriorityFilter && (
            <div className="flex items-center gap-2">
              <SearchPill
                label={activePriorityFilter.title}
                onRemove={onRemovePriorityFilter}
              />
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search your memories..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm disabled:opacity-50"
            />
            
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className={`
                p-2 rounded-full transition-all duration-200 flex-shrink-0 flex items-center justify-center
                ${canSearch 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer' 
                  : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

