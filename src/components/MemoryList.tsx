'use client';

import React, { useState } from 'react';
import MemoryCard from './MemoryCard';
import BreadcrumbNav, { BreadcrumbItem } from './BreadcrumbNav';
import type { Snapshot } from '@/types/memoir-api.types';
import { Inbox, ChevronDown } from 'lucide-react';

export type SortOption = 'match' | 'recent' | 'oldest';

interface MemoryListProps {
  memories: Snapshot[];
  breadcrumbs: BreadcrumbItem[];
  onMemoryClick: (memory: Snapshot) => void;
  onBreadcrumbNavigate: (index: number) => void;
  isLoading?: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'match', label: 'Best Match' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function MemoryList({
  memories,
  breadcrumbs,
  onMemoryClick,
  onBreadcrumbNavigate,
  isLoading = false,
}: MemoryListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sort memories based on selected option
  const sortedMemories = [...memories].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        // Sort by similarity score (highest first), fallback to timestamp
        const simA = a.similarity ?? 0;
        const simB = b.similarity ?? 0;
        if (simA !== simB) return simB - simA;
        // Fallback to most recent
        const dateA1 = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB1 = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB1 - dateA1;
      case 'recent':
        const dateA2 = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB2 = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB2 - dateA2;
      case 'oldest':
        const dateA3 = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB3 = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateA3 - dateB3;
      default:
        return 0;
    }
  });

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Best Match';

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <div className="bg-muted/30 rounded-lg px-3 py-2">
          <BreadcrumbNav items={breadcrumbs} onNavigate={onBreadcrumbNavigate} />
        </div>
      )}

      {/* Sort controls and count */}
      {memories.length > 0 && !isLoading && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {sortedMemories.length} {sortedMemories.length === 1 ? 'memory' : 'memories'}
          </div>
          
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
            >
              <span>{currentSortLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showSortMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSortMenu(false)} 
                />
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        sortBy === option.value
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Memory list */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading memories...</p>
          </div>
        ) : sortedMemories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Inbox className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg mb-1">No memories yet</p>
            <p className="text-sm text-muted-foreground/70">
              Search for memories or click a priority to see related memories here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMemories.map((memory, index) => (
              <MemoryCard
                key={memory.memory_id || index}
                memory={memory}
                onClick={onMemoryClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

