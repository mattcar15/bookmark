'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MemoryCard from './MemoryCard';
import BreadcrumbNav, { BreadcrumbItem } from './BreadcrumbNav';
import type { Snapshot } from '@/types/memoir-api.types';
import { Inbox, ChevronDown, AlertCircle } from 'lucide-react';

export type SortOption = 'match' | 'recent' | 'oldest';

// Constants for similarity filtering
const GOOD_MATCH_THRESHOLD = 0.40; // 40% match threshold
const ITEMS_PER_PAGE = 10;

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
  
  // Filtering and pagination state
  const [showLowQuality, setShowLowQuality] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset filtering/pagination when memories change
  useEffect(() => {
    setShowLowQuality(false);
    setDisplayCount(ITEMS_PER_PAGE);
  }, [memories]);

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

  // Separate into good and low quality matches
  const goodMatches = sortedMemories.filter(m => (m.similarity ?? 0) >= GOOD_MATCH_THRESHOLD);
  const lowQualityMatches = sortedMemories.filter(m => (m.similarity ?? 0) < GOOD_MATCH_THRESHOLD);
  
  // Combine items based on showLowQuality state
  const availableItems = showLowQuality ? [...goodMatches, ...lowQualityMatches] : goodMatches;
  const displayedItems = availableItems.slice(0, displayCount);
  
  // Check if there are more good matches to load
  const hasMoreGoodMatches = displayCount < goodMatches.length;
  // Check if there are low quality matches available to show
  const hasLowQualityToShow = !showLowQuality && lowQualityMatches.length > 0;
  // Check if there are more items to load (when showing low quality)
  const hasMoreItems = showLowQuality && displayCount < availableItems.length;

  // Infinite scroll observer for loading more items
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      if (hasMoreGoodMatches) {
        setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, goodMatches.length));
      } else if (hasMoreItems) {
        setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, availableItems.length));
      }
    }
  }, [hasMoreGoodMatches, hasMoreItems, goodMatches.length, availableItems.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection]);

  const handleShowLowQuality = () => {
    setShowLowQuality(true);
  };

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Best Match';
  
  // Count display text
  const countText = goodMatches.length > 0 
    ? `${goodMatches.length}${lowQualityMatches.length > 0 ? ` (+${lowQualityMatches.length} less relevant)` : ''}`
    : `${sortedMemories.length}`;

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
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
            {countText} {goodMatches.length === 1 && lowQualityMatches.length === 0 ? 'memory' : 'memories'}
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
        ) : displayedItems.length > 0 ? (
          <div className="space-y-2">
            {displayedItems.map((memory, index) => {
              const isLowQuality = (memory.similarity ?? 0) < GOOD_MATCH_THRESHOLD;
              const prevMemory = displayedItems[index - 1];
              const prevIsGoodQuality = prevMemory && (prevMemory.similarity ?? 0) >= GOOD_MATCH_THRESHOLD;
              const showDivider = isLowQuality && prevIsGoodQuality;
              
              return (
                <React.Fragment key={memory.memory_id || index}>
                  {showDivider && (
                    <div className="flex items-center gap-3 py-4 px-2">
                      <div className="flex-1 h-px bg-border" />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Less relevant matches below</span>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  <MemoryCard
                    memory={memory}
                    onClick={onMemoryClick}
                  />
                </React.Fragment>
              );
            })}
            
            {/* Intersection observer target for infinite scroll */}
            {(hasMoreGoodMatches || hasMoreItems) && <div ref={loadMoreRef} className="h-1" />}
            
            {/* Show button to load less relevant matches when good matches are exhausted */}
            {hasLowQualityToShow && !hasMoreGoodMatches && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleShowLowQuality}
                  className="py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border rounded-lg transition-colors flex items-center gap-2"
                >
                  Show {lowQualityMatches.length} less relevant match{lowQualityMatches.length !== 1 ? 'es' : ''}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          // All items are below threshold - show option to view them
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
            <p className="text-sm mb-3">No high-quality matches found</p>
            {lowQualityMatches.length > 0 && (
              <button
                onClick={handleShowLowQuality}
                className="py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Show {lowQualityMatches.length} less relevant match{lowQualityMatches.length !== 1 ? 'es' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

