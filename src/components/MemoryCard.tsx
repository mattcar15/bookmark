'use client';

import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { Snapshot } from '@/types/memoir-api.types';

interface MemoryCardProps {
  memory: Snapshot;
  onClick: (memory: Snapshot) => void;
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const title = memory.summary?.split('\n')[0]?.slice(0, 80) || 'Memory';
  const description = memory.summary?.split('\n').slice(1).join('\n').trim().slice(0, 200) || '';
  const hasMore = title.length === 80 || description.length === 200;

  return (
    <div
      onClick={() => onClick(memory)}
      className="group bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border rounded-lg p-4 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Clock className="w-3 h-3" />
            <span>{memory.timestamp ? formatRelativeTime(memory.timestamp) : 'Unknown time'}</span>
            {memory.timestamp && (
              <span className="text-muted-foreground/60">
                • {formatTimestamp(memory.timestamp)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
            {title}{title.length === 80 && '...'}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}{hasMore && '...'}
            </p>
          )}

          {/* Similarity score if available */}
          {memory.similarity !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 w-16 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/70 rounded-full"
                  style={{ width: `${memory.similarity * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground/60">
                {(memory.similarity * 100).toFixed(0)}% match
              </span>
            </div>
          )}
        </div>

        {/* Navigate indicator */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

