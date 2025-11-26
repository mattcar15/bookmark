'use client';

import { useState, useRef, useEffect } from 'react';
import Timeline from '@/components/Timeline';
import PromptBox from '@/components/PromptBox';
import Priorities from '@/components/Priorities';
import { Bookmark, BookOpen, SlidersHorizontal } from 'lucide-react';
import memoryService from '@/services/memoryService';
import type { Snapshot } from '@/types/memoir-api.types';

export default function Home() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startingWindow, setStartingWindow] = useState('auto');
  const [fullTimelineRange, setFullTimelineRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activePriorityFilter, setActivePriorityFilter] = useState<{ id: string; title: string } | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Load user info on mount to get the full timeline range
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await memoryService.getUserInfo();
        console.log('📅 User info loaded:', userInfo);
        
        const now = new Date();
        const oldestDate = userInfo.oldest_snapshot 
          ? new Date(userInfo.oldest_snapshot)
          : new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // Default to 5 days ago
        
        // Ensure minimum 1 week range
        const minDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const startDate = oldestDate < minDate ? oldestDate : minDate;
        
        setFullTimelineRange({
          start: startDate,
          end: now,
        });
        
        console.log('📅 Full timeline range set:', {
          start: startDate.toISOString(),
          end: now.toISOString(),
          durationDays: (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
        });
      } catch (error) {
        console.error('Failed to load user info:', error);
        // Fallback to 1 week range
        const now = new Date();
        setFullTimelineRange({
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
        });
      }
    };
    
    loadUserInfo();
  }, []);

  const handleSearchResults = (results: Snapshot[], query: string) => {
    setSnapshots(results);
    setSearchQuery(query);
    setIsLoading(false);
  };

  const handleSearchStart = () => {
    setIsLoading(true);
  };

  const handlePrioritySearch = async (priorityId: string) => {
    console.log('🎯 Priority search triggered for:', priorityId);
    setIsLoading(true);
    
    // Find the priority title for display
    const priorities = [
      { id: 'goal_health_fitness', title: 'Health & Fitness' },
      { id: 'goal_career_growth', title: 'Career Development' },
      { id: 'goal_creative_projects', title: 'Creative Projects' },
      { id: 'goal_learning', title: 'Learning & Education' },
    ];
    const priority = priorities.find(p => p.id === priorityId);
    
    setActivePriorityFilter(priority ? { id: priorityId, title: priority.title } : null);
    
    try {
      const response = await memoryService.searchByGoalId(priorityId, {
        k: 30,
        threshold: 0.5,
        include_stats: true,
        include_image: true,
      });
      
      console.log('✅ Priority search response:', response);
      setSnapshots(response.snapshots || []);
      setSearchQuery(`Priority: ${priority?.title || priorityId}`);
    } catch (error) {
      console.error('❌ Priority search failed:', error);
      setSnapshots([]);
      setSearchQuery('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePriorityFilter = () => {
    console.log('🗑️ Removing priority filter');
    setActivePriorityFilter(null);
    setSnapshots([]);
    setSearchQuery('');
  };

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  return (
    <div 
      className="min-h-screen p-8 pt-12 flex flex-col select-none" 
      style={{ backgroundColor: '#0a0807' }}
    >
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 fill-zinc-100" />
            {/* <h1 className="text-2xl font-semibold text-zinc-100">
              Memoir
            </h1> */}
          </div>
          
          {/* Filter Toggle - Ghost Button */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-zinc-800/50 rounded-md transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5 text-zinc-400" />
            </button>
            
            {/* Filters Popover */}
            {showFilters && (
              <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 p-4">
                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-300 block mb-2">
                    Starting Window
                  </label>
                  <select
                    value={startingWindow}
                    onChange={(e) => {
                      setStartingWindow(e.target.value);
                    }}
                    className="w-full bg-zinc-800 text-zinc-300 text-sm rounded-md px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                  >
                    <option value="auto">Auto</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priorities Section */}
        <Priorities onPrioritySearch={handlePrioritySearch} />

        {/* Timeline Component */}
        <Timeline 
          snapshots={snapshots} 
          searchQuery={searchQuery} 
          startingWindow={startingWindow}
          fullTimelineRange={fullTimelineRange}
        />

        {/* Prompt Box Component */}
        <PromptBox 
          onSearchResults={handleSearchResults} 
          onSearchStart={handleSearchStart}
          isLoading={isLoading}
          activePriorityFilter={activePriorityFilter}
          onRemovePriorityFilter={handleRemovePriorityFilter}
        />
      </div>
    </div>
  );
}
