'use client';

import { useState, useRef, useEffect } from 'react';
import Timeline from '@/components/Timeline';
import PromptBox from '@/components/PromptBox';
import Priorities from '@/components/Priorities';
import ViewToggle, { ViewMode } from '@/components/ViewToggle';
import MemoryList from '@/components/MemoryList';
import BreadcrumbNav, { BreadcrumbItem } from '@/components/BreadcrumbNav';
import DetailView from '@/components/DetailView';
import NotesView from '@/components/NotesView';
import { Bookmark, SlidersHorizontal, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import memoryService from '@/services/memoryService';
import type { Snapshot, SearchResultItem, SimilarItem } from '@/types/memoir-api.types';

// Special breadcrumb type for "Similar to X" view
interface SimilarSearchState {
  items: SimilarItem[];
  sourceTitle: string;
}

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
  // Navigation stack for detail views - enables breadcrumb back navigation
  const [detailStack, setDetailStack] = useState<SearchResultItem[]>([]);
  // State for "View All Similar" mode - when set, shows similar items in list view
  const [similarSearchState, setSimilarSearchState] = useState<SimilarSearchState | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Derive breadcrumbs from detailStack and similarSearchState
  const breadcrumbs: BreadcrumbItem[] = [
    // Add items from detail stack
    ...detailStack.map((item, index) => ({
      id: item.snapshot_id || item.memory_id || String(index),
      label: (item.title || item.summary?.slice(0, 40) || 'Memory').slice(0, 40) + 
             ((item.title || item.summary || '').length > 40 ? '...' : ''),
      timestamp: item.timestamp,
    })),
    // Add "Similar to X" breadcrumb if in similar search mode
    ...(similarSearchState ? [{
      id: 'similar-search',
      label: `Similar to "${similarSearchState.sourceTitle.slice(0, 25)}${similarSearchState.sourceTitle.length > 25 ? '...' : ''}"`,
    }] : []),
  ];

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
    // Reset detail stack and similar search when new search happens
    setDetailStack([]);
    setSimilarSearchState(null);
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
    
    // Reset detail stack and similar search when new priority search happens
    setDetailStack([]);
    setSimilarSearchState(null);
    
    try {
      const response = await memoryService.searchByGoalId(priorityId, {
        k: 30,
        threshold: 0.3,
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
    setDetailStack([]);
    setSimilarSearchState(null);
  };

  // Handle memory click - push to detail stack for breadcrumb navigation
  const handleMemoryClick = (memory: Snapshot) => {
    console.log('📍 Memory clicked:', memory);
    
    // Convert Snapshot to SearchResultItem format for DetailView
    const searchResult: SearchResultItem = {
      snapshot_id: memory.snapshot_id,
      memory_id: memory.memory_id,
      episode_id: memory.episode_id,
      timestamp: memory.timestamp,
      captured_at: memory.captured_at,
      app: memory.app,
      url: memory.url,
      window_title: memory.window_title,
      image_path: memory.image_url, // Snapshot uses image_url, SearchResultItem uses image_path
      title: memory.title,
      summary: memory.summary,
      bullets: memory.bullets,
      tags: memory.tags,
      entities: memory.entities,
      similarity: memory.similarity,
      vector_score: memory.vector_score,
      bm25_score: memory.bm25_score,
    };
    
    // Push to detail stack (starts fresh navigation)
    setDetailStack([searchResult]);
  };

  // Handle clicking a similar item in the detail view - adds to breadcrumb trail
  const handleSimilarClick = (item: SimilarItem) => {
    console.log('🔗 Similar item clicked:', item);
    
    // Convert SimilarItem to SearchResultItem format
    const searchResult: SearchResultItem = {
      snapshot_id: item.snapshot_id,
      memory_id: item.memory_id,
      episode_id: item.episode_id,
      timestamp: item.timestamp,
      title: item.title,
      summary: item.summary,
      image_path: item.image_path,
      app: item.app,
      similarity: item.similarity,
    };
    
    // If we're in similar search mode, clear it and replace with the clicked item
    if (similarSearchState) {
      setSimilarSearchState(null);
    }
    
    // Push to detail stack (adds to breadcrumb trail)
    setDetailStack(prev => [...prev, searchResult]);
  };

  // Handle "View All Similar" - shows similar items in a list view
  const handleViewAllSimilar = (items: SimilarItem[], sourceTitle: string) => {
    console.log('👁️ View all similar:', items.length, 'items for', sourceTitle);
    setSimilarSearchState({ items, sourceTitle });
  };

  // Handle breadcrumb navigation - navigate back through detail history
  const handleBreadcrumbNavigate = (index: number) => {
    console.log('🔙 Navigating to breadcrumb index:', index, 'detailStack length:', detailStack.length, 'similarSearchState:', !!similarSearchState);
    
    if (index === -1) {
      // Navigate to home (root level) - clear all detail navigation and similar search
      setDetailStack([]);
      setSimilarSearchState(null);
    } else if (similarSearchState && index === breadcrumbs.length - 1) {
      // Clicking on "Similar to X" breadcrumb when we're already there - do nothing
      return;
    } else if (index < detailStack.length) {
      // Navigate to a specific item in the detail stack
      setDetailStack(prev => prev.slice(0, index + 1));
      setSimilarSearchState(null); // Clear similar search when navigating back
    }
    // If clicking the current breadcrumb (last item), do nothing
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
    <div className="h-screen flex flex-col select-none bg-background text-foreground transition-colors duration-200 relative overflow-hidden">
      {/* Draggable title bar region */}
      <div
        data-tauri-drag-region
        className="h-7 flex items-center px-3 shrink-0"
      >
        {/* Left space for macOS traffic lights */}
        <div className="w-20" />
        
        {/* Center - can show title or leave empty */}
        <div className="flex-1" data-tauri-drag-region />
      </div>

      {/* Main content - scrollable area */}
      <div className={`flex-1 overflow-auto flex flex-col ${viewMode === 'notes' ? 'pb-8' : 'pb-32'}`}>
        <div className="p-8 pt-1 flex-1 flex flex-col">
          <div className="max-w-6xl w-full mx-auto flex flex-col gap-6 flex-1">
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

            {/* Priorities Section - Only show in timeline mode */}
            {viewMode === 'timeline' && (
              <Priorities onPrioritySearch={handlePrioritySearch} compact={true} />
            )}

            {/* Breadcrumb Navigation - shown when navigating detail views (not in notes mode) */}
            {viewMode !== 'notes' && detailStack.length > 0 && (
              <BreadcrumbNav items={breadcrumbs} onNavigate={handleBreadcrumbNavigate} />
            )}

            {/* Content Area - switches based on view mode and detail state */}
            {viewMode === 'notes' ? (
              // Show notes view
              <NotesView />
            ) : similarSearchState ? (
              // Show similar items in list view
              <MemoryList
                memories={similarSearchState.items.map(item => ({
                  snapshot_id: item.snapshot_id,
                  memory_id: item.memory_id,
                  episode_id: item.episode_id,
                  timestamp: item.timestamp,
                  title: item.title,
                  summary: item.summary,
                  image_url: item.image_path,
                  app: item.app,
                  similarity: item.similarity,
                }))}
                breadcrumbs={[]}
                onMemoryClick={(memory) => {
                  // Convert back to SimilarItem and use handleSimilarClick
                  const similarItem: SimilarItem = {
                    snapshot_id: memory.snapshot_id,
                    memory_id: memory.memory_id,
                    episode_id: memory.episode_id,
                    timestamp: memory.timestamp,
                    title: memory.title,
                    summary: memory.summary,
                    image_path: memory.image_url,
                    app: memory.app,
                    similarity: memory.similarity,
                  };
                  handleSimilarClick(similarItem);
                }}
                onBreadcrumbNavigate={handleBreadcrumbNavigate}
                isLoading={false}
              />
            ) : detailStack.length > 0 ? (
              // Show detail view for the current item in the stack
              <DetailView
                result={detailStack[detailStack.length - 1]}
                onSimilarClick={handleSimilarClick}
                onViewAllSimilar={handleViewAllSimilar}
              />
            ) : viewMode === 'timeline' ? (
              <Timeline 
                snapshots={snapshots} 
                searchQuery={searchQuery} 
                startingWindow={startingWindow}
                fullTimelineRange={fullTimelineRange}
              />
            ) : (
              <MemoryList
                memories={snapshots}
                breadcrumbs={[]}
                onMemoryClick={handleMemoryClick}
                onBreadcrumbNavigate={handleBreadcrumbNavigate}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom prompt box with gradient fade - hide in notes mode */}
      {viewMode !== 'notes' && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          {/* Gradient fade overlay */}
          <div className="h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
          
          {/* Prompt box container */}
          <div className="bg-background px-8 pb-6">
            <div className="max-w-6xl w-full mx-auto">
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
      )}
    </div>
  );
}
