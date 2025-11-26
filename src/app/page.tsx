'use client';

import { useState, useRef, useEffect } from 'react';
import Timeline from '@/components/Timeline';
import PromptBox from '@/components/PromptBox';
import Priorities from '@/components/Priorities';
import ViewToggle, { ViewMode } from '@/components/ViewToggle';
import MemoryList from '@/components/MemoryList';
import { BreadcrumbItem } from '@/components/BreadcrumbNav';
import { Bookmark, SlidersHorizontal, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import memoryService from '@/services/memoryService';
import type { Snapshot } from '@/types/memoir-api.types';

export default function Home() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startingWindow, setStartingWindow] = useState('auto');
  const [fullTimelineRange, setFullTimelineRange] = useState<{ start: Date; end: Date } | null>(null);
  const [activePriorityFilter, setActivePriorityFilter] = useState<{ id: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chronological');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [memoryStack, setMemoryStack] = useState<Snapshot[][]>([]);
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
    // Reset breadcrumbs when new search happens
    setBreadcrumbs([]);
    setMemoryStack([]);
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
    
    // Reset breadcrumbs when new priority search happens
    setBreadcrumbs([]);
    setMemoryStack([]);
    
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
    setBreadcrumbs([]);
    setMemoryStack([]);
  };

  // Handle memory click for breadcrumb navigation
  const handleMemoryClick = (memory: Snapshot) => {
    console.log('📍 Memory clicked:', memory);
    
    // For now, we'll simulate drilling into a memory
    // In a real implementation, this would fetch child memories
    const label = memory.summary?.split('\n')[0]?.slice(0, 40) || 'Memory';
    
    // Save current state to stack
    setMemoryStack(prev => [...prev, snapshots]);
    
    // Add to breadcrumbs
    setBreadcrumbs(prev => [
      ...prev,
      {
        id: memory.memory_id || String(Date.now()),
        label: label + (label.length === 40 ? '...' : ''),
        timestamp: memory.timestamp,
      }
    ]);
    
    // For demo purposes, show just this memory
    // In real implementation, you'd fetch child/related memories
    setSnapshots([memory]);
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (index: number) => {
    console.log('🔙 Navigating to breadcrumb index:', index);
    
    if (index === -1) {
      // Navigate to home (root level)
      if (memoryStack.length > 0) {
        setSnapshots(memoryStack[0]);
      }
      setBreadcrumbs([]);
      setMemoryStack([]);
    } else if (index < breadcrumbs.length - 1) {
      // Navigate to a specific level
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const newStack = memoryStack.slice(0, index + 1);
      
      // Restore the snapshots from the next level in the stack
      if (memoryStack[index + 1]) {
        setSnapshots(memoryStack[index + 1]);
      } else if (memoryStack[index]) {
        setSnapshots(memoryStack[index]);
      }
      
      setBreadcrumbs(newBreadcrumbs);
      setMemoryStack(newStack);
    }
    // If clicking the current breadcrumb, do nothing
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
    <div className="min-h-screen flex flex-col select-none bg-background text-foreground transition-colors duration-200">
      {/* Draggable title bar region */}
      <div
        data-tauri-drag-region
        className="h-8 flex items-center px-3 shrink-0"
      >
        {/* Left space for macOS traffic lights */}
        <div className="w-20" />
        
        {/* Center - can show title or leave empty */}
        <div className="flex-1" data-tauri-drag-region />
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 pt-4 flex flex-col overflow-auto">
        <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bookmark className="w-6 h-6 fill-foreground" />
            </div>
            
            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                aria-label="Toggle theme"
              >
                {mounted && (theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                ))}
                {!mounted && <div className="w-4 h-4" />}
              </button>
              
              {/* Filter Toggle - Ghost Button */}
              <div className="relative" ref={filtersRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
                
                {/* Filters Popover */}
                {showFilters && (
                  <div className="absolute right-0 top-10 w-64 bg-card border border-border rounded-lg shadow-xl z-50 p-4">
                    <div className="mb-4">
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Starting Window
                      </label>
                      <select
                        value={startingWindow}
                        onChange={(e) => {
                          setStartingWindow(e.target.value);
                        }}
                        className="w-full bg-muted text-foreground text-sm rounded-md px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
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
          </div>

          {/* Priorities Section - Compact by default */}
          <Priorities onPrioritySearch={handlePrioritySearch} compact={true} />

          {/* Content Area - switches based on view mode */}
          {viewMode === 'timeline' ? (
            <Timeline 
              snapshots={snapshots} 
              searchQuery={searchQuery} 
              startingWindow={startingWindow}
              fullTimelineRange={fullTimelineRange}
            />
          ) : (
            <MemoryList
              memories={snapshots}
              breadcrumbs={breadcrumbs}
              onMemoryClick={handleMemoryClick}
              onBreadcrumbNavigate={handleBreadcrumbNavigate}
              isLoading={isLoading}
            />
          )}

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
    </div>
  );
}
