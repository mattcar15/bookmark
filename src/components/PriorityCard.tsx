'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Telescope } from 'lucide-react';
import type { Priority } from '@/types/priority.types';

interface PriorityCardProps {
  priority: Priority;
  onSearch: (priorityId: string) => void;
}

export default function PriorityCard({ priority, onSearch }: PriorityCardProps) {
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
    e.stopPropagation(); // Prevent card click from triggering
    onSearch(priority.id);
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleCardClick}
        className="relative bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-6 cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/60 transition-all flex-shrink-0 w-80 h-44"
      >
        <div className="flex flex-col h-full gap-3">
          {/* Header with title and button */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-medium text-zinc-100 flex-1">
              {priority.title}
            </h3>
            <button
              onClick={handleSearchClick}
              className="flex-shrink-0 p-2 bg-zinc-700/50 hover:bg-zinc-600 rounded-md transition-colors"
              aria-label="Search by this priority"
            >
              <Telescope className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
          
          {/* Description */}
          <div className="flex-1">
            <p className="text-sm text-zinc-400 line-clamp-4 leading-relaxed">
              {priority.description}
            </p>
          </div>
        </div>
      </div>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="fixed z-50 w-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-6"
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
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">
              {priority.title}
            </h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {priority.description}
            </p>
          </div>
          
          <div className="border-t border-zinc-800 pt-4 mt-4">
            <h5 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Details
            </h5>
            <div className="space-y-2 text-sm text-zinc-400">
              <div className="flex justify-between">
                <span>Priority ID:</span>
                <span className="text-zinc-300 font-mono text-xs">{priority.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearchClick}
            className="w-full mt-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-sm text-zinc-100 transition-colors flex items-center justify-center gap-2"
          >
            <Telescope className="w-4 h-4" />
            Search Memories for This Priority
          </button>
        </div>
      )}
    </>
  );
}

