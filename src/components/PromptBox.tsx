'use client';

import React, { useState } from 'react';
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

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;

    console.log('🔍 Starting search for:', query.trim());
    onSearchStart();
    
    try {
      console.log('📡 Calling Memoir API...');
      const response = await memoryService.searchSnapshots({
        query: query.trim(),
        k: 30,
        threshold: 0.5,
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
        <div className="bg-zinc-800 rounded-full p-3 border border-zinc-700 flex items-center gap-3">
          <div className="p-2 flex-shrink-0">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          
          {/* Active Priority Filter Pill */}
          {activePriorityFilter && onRemovePriorityFilter && (
            <SearchPill
              label={activePriorityFilter.title}
              onRemove={onRemovePriorityFilter}
            />
          )}
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search your memories..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-base disabled:opacity-50"
          />
          
          {query.trim() && (
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="p-2 bg-zinc-100 hover:bg-white rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

