'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Telescope } from 'lucide-react';
import type { Priority } from '@/types/priority.types';

interface PriorityCardProps {
  priority: Priority;
  onSearch: (priorityId: string) => void;
  compact?: boolean;
}

export default function PriorityCard({ priority, onSearch, compact = true }: PriorityCardProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  const handleCardClick = () => {
    setShowPopover(!showPopover);
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSearch(priority.id);
  };

  // Compact mode: smaller, title-only cards
  if (compact) {
    return (
      <>
        <div
          ref={cardRef}
          onClick={handleCardClick}
          className="relative bg-muted/40 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-3 cursor-pointer hover:border-border hover:bg-muted/60 transition-all flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            {/* Color indicator */}
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: priority.color }}
            />
            
            {/* Title */}
            <h3 className="text-sm font-medium text-foreground whitespace-nowrap">
              {priority.title.replace(' Goals', '').replace(' & ', ' / ')}
            </h3>
          </div>
        </div>

        {/* Popover */}
        {showPopover && (
          <div
            ref={popoverRef}
            className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-2xl p-5"
            style={{
              top: cardRef.current
                ? `${cardRef.current.getBoundingClientRect().bottom + 8}px`
                : '50%',
              left: cardRef.current
                ? `${cardRef.current.getBoundingClientRect().left}px`
                : '50%',
            }}
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: priority.color }}
                />
                <h4 className="text-base font-semibold text-foreground">
                  {priority.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {priority.description}
              </p>
            </div>

            <button
              onClick={handleSearchClick}
              className="w-full py-2 bg-accent hover:bg-accent/80 rounded-md text-sm text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <Telescope className="w-4 h-4" />
              View Memories
            </button>
          </div>
        )}
      </>
    );
  }

  // Full mode: larger cards with descriptions
  return (
    <>
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className="relative bg-muted/40 backdrop-blur-sm border border-border/50 rounded-lg p-6 cursor-pointer hover:border-border hover:bg-muted/60 transition-all flex-shrink-0 w-80 h-44"
      >
        <div className="flex flex-col h-full gap-3">
          {/* Header with title and button */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-foreground flex-1">
              {priority.title}
            </h3>
            <button
              onClick={handleSearchClick}
              className="flex-shrink-0 p-2 bg-accent/50 hover:bg-accent rounded-md transition-colors"
              aria-label="Search by this priority"
            >
              <Telescope className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* Description */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
              {priority.description}
            </p>
          </div>
        </div>
      </div>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-96 bg-card border border-border rounded-lg shadow-2xl p-6"
          style={{
            top: cardRef.current
              ? `${cardRef.current.getBoundingClientRect().bottom + 8}px`
              : '50%',
            left: cardRef.current
              ? `${cardRef.current.getBoundingClientRect().left}px`
              : '50%',
          }}
        >
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-foreground mb-2">
              {priority.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {priority.description}
            </p>
          </div>
          
          <div className="border-t border-border pt-4 mt-4">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Details
            </h5>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Priority ID:</span>
                <span className="text-foreground font-mono text-xs">{priority.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearchClick}
            className="w-full mt-4 py-2 bg-accent hover:bg-accent/80 rounded-md text-sm text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Telescope className="w-4 h-4" />
            Search Memories for This Priority
          </button>
        </div>
      )}
    </>
  );
}
