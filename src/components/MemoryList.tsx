'use client';

import React from 'react';
import MemoryCard from './MemoryCard';
import BreadcrumbNav, { BreadcrumbItem } from './BreadcrumbNav';
import type { Snapshot } from '@/types/memoir-api.types';
import { Inbox } from 'lucide-react';

interface MemoryListProps {
  memories: Snapshot[];
  breadcrumbs: BreadcrumbItem[];
  onMemoryClick: (memory: Snapshot) => void;
  onBreadcrumbNavigate: (index: number) => void;
  isLoading?: boolean;
}

export default function MemoryList({
  memories,
  breadcrumbs,
  onMemoryClick,
  onBreadcrumbNavigate,
  isLoading = false,
}: MemoryListProps) {
  // Sort memories by timestamp, most recent first
  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <div className="bg-muted/30 rounded-lg px-3 py-2">
          <BreadcrumbNav items={breadcrumbs} onNavigate={onBreadcrumbNavigate} />
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
            <div className="text-xs text-muted-foreground mb-3">
              {sortedMemories.length} {sortedMemories.length === 1 ? 'memory' : 'memories'}
            </div>
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

