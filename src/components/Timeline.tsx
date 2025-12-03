'use client';

import React, { useState, useRef, useMemo } from 'react';
import type { Snapshot } from '@/types/memoir-api.types';

interface TimelineEvent {
  date: string;
  position: number;
  title: string;
  description: string;
  prominence: number;
  similarity: number; // Raw similarity score (0-1)
  displayPosition?: number;
  snapshot?: Snapshot;
}

interface TimelineProps {
  snapshots: Snapshot[];
  searchQuery: string;
  startingWindow: string;
  fullTimelineRange: { start: Date; end: Date } | null;
}

// =============================================================================
// TUNING PARAMETERS - Adjust these to control circle appearance
// =============================================================================
const TUNING = {
  // Base size parameters (based on zoom level)
  BASE_SIZE: {
    MIN: 4,           // Minimum base size at max zoom out (pixels)
    MAX: 14,          // Maximum base size at max zoom in (pixels)
  },
  
  // Similarity boost parameters (added on top of base size)
  SIMILARITY_BOOST: {
    MAX_BOOST: 12,     // Maximum additional size from similarity (pixels)
    EXPONENT: 1.5,     // Exponent for similarity curve (>1 = emphasize high scores)
  },
  
  // Opacity parameters
  OPACITY: {
    MIN: 0.25,         // Minimum opacity for lowest similarity in view
    MAX: 1.0,          // Maximum opacity for highest similarity in view
    EXPONENT: 1.2,     // Exponent for opacity curve (>1 = emphasize high scores)
  },
  
  // Overlap handling parameters
  OVERLAP: {
    // Score difference threshold: if the worse circle's score is within this
    // percentage of the better circle's score, show both
    SCORE_PROXIMITY_THRESHOLD: 0.15, // 15% - if scores are within 15%, show both
    
    // Minimum pixel distance between circle centers to not be considered overlapping
    // This is calculated as a fraction of the combined radii
    OVERLAP_RATIO: 0.7, // Circles overlap if distance < 70% of combined radii
    
    // Zoom threshold: at this zoom level or higher, always show all circles
    // Higher number = more zoomed in (e.g., 50 = showing ~2% of total range)
    ALWAYS_SHOW_ZOOM_THRESHOLD: 20,
  },
};

export default function Timeline({ snapshots, searchQuery, startingWindow, fullTimelineRange }: TimelineProps) {
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const centerWeight = 0.01; // 0 = zoom to cursor, 1 = zoom to center
  
  // Calculate optimal zoom level - show all data with minimal padding
  const getOptimalZoom = React.useCallback(() => {
    // zoom = 1 means windowWidth = 100 (show exactly 100% of search results)
    // Use 0.95 for tiny bit of padding so events aren't right at edge
    const zoom = 0.95;
    
    console.log('🔍 getOptimalZoom: setting zoom to', zoom, '(showing', 100 / zoom, '% of data)');
    
    return zoom;
  }, []);

  // Calculate zoom for specific window setting (when user manually selects a time window)
  const getZoomForWindow = React.useCallback((window: string, dataTimeRangeMs: number) => {
    switch(window) {
      case 'hour': return (dataTimeRangeMs / (60 * 60 * 1000)) * 100;
      case 'day': return (dataTimeRangeMs / (24 * 60 * 60 * 1000)) * 100;
      case 'week': return (dataTimeRangeMs / (7 * 24 * 60 * 60 * 1000)) * 100;
      case 'month': return (dataTimeRangeMs / (30 * 24 * 60 * 60 * 1000)) * 100;
      case 'year': return (dataTimeRangeMs / (365 * 24 * 60 * 60 * 1000)) * 100;
      case 'auto':
      default: 
        return getOptimalZoom();
    }
  }, [getOptimalZoom]);
  
  const [zoom, setZoom] = useState(1);
  const [viewCenter, setViewCenter] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate time range from snapshots
  const timeRange = React.useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return null;
    }

    const timestamps = snapshots
      .map(s => s.timestamp ? new Date(s.timestamp).getTime() : null)
      .filter((t): t is number => t !== null);
    
    if (timestamps.length === 0) return null;

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return {
      minTime,
      maxTime,
      duration: maxTime - minTime || 1,
    };
  }, [snapshots]);

  // Convert snapshots to timeline events
  const allEvents: TimelineEvent[] = React.useMemo(() => {
    if (!snapshots || snapshots.length === 0 || !timeRange) return [];

    return snapshots
      .filter(s => s.timestamp)
      .map((snapshot, index) => {
        const timestamp = new Date(snapshot.timestamp!).getTime();
        const position = ((timestamp - timeRange.minTime) / timeRange.duration) * 100;
        
        // Store raw similarity score (0-1), default to 0.5 if not available
        const similarity = snapshot.similarity ?? 0.5;
        
        // Use similarity score as prominence (0-1 -> 1-10)
        const prominence = Math.max(1, Math.min(10, similarity * 10));

        // Extract title from summary (first line or first 50 chars)
        const summary = snapshot.summary || 'Snapshot';
        const lines = summary.split('\n');
        const title = lines[0].slice(0, 60) + (lines[0].length > 60 ? '...' : '');
        
        // Use rest of summary as description
        const restOfSummary = lines.slice(1).join('\n').trim();
        const description = restOfSummary || summary.slice(0, 150);

        return {
          date: new Date(snapshot.timestamp!).toLocaleString(),
          position,
          title,
          description: description || 'No additional details',
          prominence,
          similarity,
          snapshot,
        };
      });
  }, [snapshots, timeRange]);

  // Update zoom when time range changes
  React.useEffect(() => {
    if (timeRange) {
      console.log('📊 Timeline effect triggered');
      console.log('  timeRange.duration (ms):', timeRange.duration);
      console.log('  timeRange.duration (hours):', timeRange.duration / (60 * 60 * 1000));
      console.log('  startingWindow:', startingWindow);
      
      const newZoom = startingWindow === 'auto' 
        ? getOptimalZoom()
        : getZoomForWindow(startingWindow, timeRange.duration);
      
      console.log('  Setting zoom to:', newZoom);
      setZoom(newZoom);
      
      // Always center at 50 (middle of the 0-100 data range)
      setViewCenter(50);
      console.log('  viewCenter set to 50 (centered on data)');
    }
  }, [timeRange, startingWindow, getZoomForWindow, getOptimalZoom]);

  const windowWidth = 100 / zoom;
  // Don't clamp when showing padding (windowWidth > 100)
  // This allows the data (0-100) to be centered with empty space on sides
  const windowStart = viewCenter - windowWidth / 2;
  const windowEnd = viewCenter + windowWidth / 2;

  // Log visible window calculation
  React.useEffect(() => {
    if (timeRange) {
      const visibleDurationMs = (timeRange.duration * windowWidth) / 100;
      const visibleHours = visibleDurationMs / (60 * 60 * 1000);
      const visibleDays = visibleDurationMs / (24 * 60 * 60 * 1000);
      
      console.log('👁️ Visible window:');
      console.log('  zoom:', zoom);
      console.log('  windowWidth:', windowWidth, '%');
      console.log('  windowStart:', windowStart, '%');
      console.log('  windowEnd:', windowEnd, '%');
      console.log('  visibleDurationMs:', visibleDurationMs);
      console.log('  visibleHours:', visibleHours);
      console.log('  visibleDays:', visibleDays);
    }
  }, [zoom, windowWidth, windowStart, windowEnd, timeRange]);

  // Calculate base size based on current zoom level
  const baseSize = useMemo(() => {
    if (!timeRange) return TUNING.BASE_SIZE.MAX;
    
    // Calculate window duration
    const windowDurationMs = (timeRange.duration * windowWidth) / 100;
    const windowHours = windowDurationMs / (60 * 60 * 1000);
    
    const MIN_WINDOW_HOURS = 1;
    const absoluteOldest = new Date('2025-01-01T00:00:00Z').getTime();
    const now = new Date().getTime();
    const maxWindowMs = now - absoluteOldest;
    const MAX_WINDOW_HOURS = maxWindowMs / (60 * 60 * 1000);
    
    const clampedWindowHours = Math.max(MIN_WINDOW_HOURS, Math.min(MAX_WINDOW_HOURS, windowHours));
    const ratio = (clampedWindowHours - MIN_WINDOW_HOURS) / (MAX_WINDOW_HOURS - MIN_WINDOW_HOURS);
    
    return TUNING.BASE_SIZE.MAX - ratio * (TUNING.BASE_SIZE.MAX - TUNING.BASE_SIZE.MIN);
  }, [timeRange, windowWidth]);

  // Process visible events with similarity-based sizing and overlap handling
  const visibleEvents = useMemo(() => {
    // Step 1: Filter to events in the visible window
    const inWindow = allEvents
      .filter(e => e.position >= windowStart && e.position <= windowEnd)
      .map(e => ({
        ...e,
        displayPosition: ((e.position - windowStart) / windowWidth) * 100
      }));
    
    if (inWindow.length === 0) return [];
    
    // Step 2: Calculate normalized similarity scores relative to visible events
    const similarities = inWindow.map(e => e.similarity);
    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);
    const similarityRange = maxSimilarity - minSimilarity || 1; // Avoid division by zero
    
    // Step 3: Calculate size and opacity for each event
    const eventsWithMetrics = inWindow.map(e => {
      // Normalize similarity to 0-1 range within visible events
      const normalizedSimilarity = (e.similarity - minSimilarity) / similarityRange;
      
      // Apply exponent for non-linear scaling (emphasize higher scores)
      const sizeBoostFactor = Math.pow(normalizedSimilarity, TUNING.SIMILARITY_BOOST.EXPONENT);
      const opacityFactor = Math.pow(normalizedSimilarity, TUNING.OPACITY.EXPONENT);
      
      // Calculate final size: base + similarity boost
      const size = baseSize + (sizeBoostFactor * TUNING.SIMILARITY_BOOST.MAX_BOOST);
      
      // Calculate final opacity
      const opacity = TUNING.OPACITY.MIN + (opacityFactor * (TUNING.OPACITY.MAX - TUNING.OPACITY.MIN));
      
      return {
        ...e,
        normalizedSimilarity,
        calculatedSize: size,
        calculatedOpacity: opacity,
      };
    });
    
    // Step 4: Sort by similarity (best first) for overlap processing
    eventsWithMetrics.sort((a, b) => b.similarity - a.similarity);
    
    // Step 5: Handle overlapping circles
    // At high zoom levels, skip overlap filtering
    const shouldFilterOverlaps = zoom < TUNING.OVERLAP.ALWAYS_SHOW_ZOOM_THRESHOLD;
    
    if (!shouldFilterOverlaps) {
      // Return all events, just limit to reasonable number
      return eventsWithMetrics.slice(0, 50);
    }
    
    // Filter overlapping events
    const visibleAfterOverlapFilter: typeof eventsWithMetrics = [];
    
    for (const event of eventsWithMetrics) {
      // Check if this event overlaps with any already-visible event
      let shouldShow = true;
      
      for (const visibleEvent of visibleAfterOverlapFilter) {
        // Calculate pixel distance between circle centers
        // displayPosition is 0-100% of the visible width
        const positionDiff = Math.abs(event.displayPosition! - visibleEvent.displayPosition!);
        
        // Convert percentage to approximate pixels (assuming ~1000px width)
        // This is a rough estimate - actual overlap depends on container width
        const pixelDistance = (positionDiff / 100) * 1000;
        
        // Combined radii
        const combinedRadii = (event.calculatedSize + visibleEvent.calculatedSize) / 2;
        
        // Check if circles overlap
        const isOverlapping = pixelDistance < combinedRadii * TUNING.OVERLAP.OVERLAP_RATIO;
        
        if (isOverlapping) {
          // Calculate score proximity
          const scoreDiff = Math.abs(event.similarity - visibleEvent.similarity);
          const avgScore = (event.similarity + visibleEvent.similarity) / 2;
          const scoreProximity = avgScore > 0 ? scoreDiff / avgScore : 0;
          
          // If scores are close enough, show both; otherwise hide the worse one
          if (scoreProximity > TUNING.OVERLAP.SCORE_PROXIMITY_THRESHOLD) {
            shouldShow = false;
            break;
          }
        }
      }
      
      if (shouldShow) {
        visibleAfterOverlapFilter.push(event);
      }
    }
    
    // Limit to reasonable number of events
    return visibleAfterOverlapFilter.slice(0, 50);
  }, [allEvents, windowStart, windowEnd, windowWidth, baseSize, zoom]);

  const positionToDate = (position: number) => {
    if (!timeRange) {
      // Fallback to default date range
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      return startDate;
    }

    // Position 0-100 maps to timeRange.minTime to timeRange.maxTime
    // But positions can go outside this range when zoomed out
    const time = timeRange.minTime + (position / 100) * timeRange.duration;
    return new Date(time);
  };

  const getTimeLabels = (majorTicks: Array<{ position: number; time: number }>) => {
    // If more than 8 major ticks, show labels on every other tick
    const shouldSkip = majorTicks.length > 8;
    const ticksToLabel = shouldSkip 
      ? majorTicks.filter((_, index) => index % 2 === 0)
      : majorTicks;
    
    return ticksToLabel.map(tick => {
      const date = new Date(tick.time);
      const startDate = positionToDate(windowStart);
      const endDate = positionToDate(windowEnd);
      const windowDuration = endDate.getTime() - startDate.getTime();
      
      let label;
      // Format based on window duration
      if (windowDuration < 2 * 60 * 60 * 1000) { // < 2 hours
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (windowDuration < 12 * 60 * 60 * 1000) { // < 12 hours
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      } else if (windowDuration < 3 * 24 * 60 * 60 * 1000) { // < 3 days
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        label = `${dateStr} • ${timeStr}`;
      } else if (windowDuration < 14 * 24 * 60 * 60 * 1000) { // < 2 weeks
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (windowDuration < 60 * 24 * 60 * 60 * 1000) { // < 2 months
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (windowDuration < 365 * 24 * 60 * 60 * 1000) { // < 1 year
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        label = date.getFullYear().toString();
      }
      
      return {
        label,
        position: tick.position
      };
    });
  };

  const getTicks = () => {
    const startDate = positionToDate(windowStart);
    const endDate = positionToDate(windowEnd);
    const windowDuration = endDate.getTime() - startDate.getTime();
    const ticks = [];
    const majorTicks = [];
    
    // Determine tick interval based on window size
    let majorInterval, minorInterval;
    
    if (windowDuration < 2 * 60 * 60 * 1000) { // < 2 hours
      majorInterval = 15 * 60 * 1000; // 15 minutes
      minorInterval = 5 * 60 * 1000; // 5 minutes
    } else if (windowDuration < 12 * 60 * 60 * 1000) { // < 12 hours
      majorInterval = 60 * 60 * 1000; // 1 hour
      minorInterval = 15 * 60 * 1000; // 15 minutes
    } else if (windowDuration < 3 * 24 * 60 * 60 * 1000) { // < 3 days
      majorInterval = 6 * 60 * 60 * 1000; // 6 hours
      minorInterval = 60 * 60 * 1000; // 1 hour
    } else if (windowDuration < 14 * 24 * 60 * 60 * 1000) { // < 2 weeks
      majorInterval = 24 * 60 * 60 * 1000; // 1 day
      minorInterval = 6 * 60 * 60 * 1000; // 6 hours
    } else if (windowDuration < 60 * 24 * 60 * 60 * 1000) { // < 2 months
      majorInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
      minorInterval = 24 * 60 * 60 * 1000; // 1 day
    } else if (windowDuration < 365 * 24 * 60 * 60 * 1000) { // < 1 year
      majorInterval = 30 * 24 * 60 * 60 * 1000; // ~1 month
      minorInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
    } else {
      majorInterval = 365 * 24 * 60 * 60 * 1000; // 1 year
      minorInterval = 30 * 24 * 60 * 60 * 1000; // ~1 month
    }
    
    if (!timeRange) return { ticks: [], majorTicks: [] };

    // Generate major ticks
    let time = Math.floor(startDate.getTime() / majorInterval) * majorInterval;
    while (time <= endDate.getTime()) {
      const dataPosition = ((time - timeRange.minTime) / timeRange.duration) * 100;
      
      if (dataPosition >= windowStart && dataPosition <= windowEnd) {
        const displayPosition = ((dataPosition - windowStart) / windowWidth) * 100;
        ticks.push({ position: displayPosition, type: 'major' });
        majorTicks.push({ position: displayPosition, time });
      }
      time += majorInterval;
    }
    
    // Generate minor ticks
    time = Math.floor(startDate.getTime() / minorInterval) * minorInterval;
    while (time <= endDate.getTime()) {
      const isMajor = time % majorInterval === 0;
      if (!isMajor) {
        const dataPosition = ((time - timeRange.minTime) / timeRange.duration) * 100;
        
        if (dataPosition >= windowStart && dataPosition <= windowEnd) {
          const displayPosition = ((dataPosition - windowStart) / windowWidth) * 100;
          ticks.push({ position: displayPosition, type: 'minor' });
        }
      }
      time += minorInterval;
    }
    
    return { ticks, majorTicks };
  };

  const getTimeframeLabel = () => {
    if (!timeRange) return 'No data';
    
    // Calculate visible window duration in milliseconds
    const visibleDurationMs = (timeRange.duration * windowWidth) / 100;
    const totalDays = visibleDurationMs / (24 * 60 * 60 * 1000);
    
    if (totalDays >= 365) {
      return `${(totalDays / 365).toFixed(1)} years`;
    } else if (totalDays >= 30) {
      return `${(totalDays / 30).toFixed(1)} months`;
    } else if (totalDays >= 1) {
      return `${totalDays.toFixed(1)} days`;
    } else if (totalDays >= 1/24) {
      return `${(totalDays * 24).toFixed(1)} hours`;
    } else {
      return `${(totalDays * 24 * 60).toFixed(0)} minutes`;
    }
  };

  const handleTimelineHover = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging || visibleEvents.length === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    const closest = visibleEvents.reduce((prev, curr) => {
      const prevDist = Math.abs((prev.displayPosition || 0) - percentage);
      const currDist = Math.abs((curr.displayPosition || 0) - percentage);
      return currDist < prevDist ? curr : prev;
    }, visibleEvents[0]);
    
    if (closest && Math.abs((closest.displayPosition || 0) - percentage) < 3) {
      setHoveredEvent(closest);
      setHoverPosition(percentage);
    } else {
      setHoveredEvent(null);
    }
  };

  // Calculate effective bounds for zoom/pan that encompass both search results AND full timeline range
  // This ensures search results are never cut off, and user can zoom out to see historical context
  const getEffectiveBounds = React.useCallback(() => {
    if (!timeRange) return { minPosition: 0, maxPosition: 100 };
    
    // Absolute oldest date floor: Jan 1, 2025
    const absoluteOldestDate = new Date('2025-01-01T00:00:00Z');
    const now = new Date();
    
    // Get the effective oldest and newest times
    // Must include: search results (timeRange), fullTimelineRange, and absolute bounds
    let effectiveOldestTime = Math.min(timeRange.minTime, absoluteOldestDate.getTime());
    let effectiveNewestTime = Math.max(timeRange.maxTime, now.getTime());
    
    if (fullTimelineRange) {
      effectiveOldestTime = Math.min(effectiveOldestTime, fullTimelineRange.start.getTime());
      effectiveNewestTime = Math.max(effectiveNewestTime, fullTimelineRange.end.getTime());
    }
    
    // Calculate positions in data coordinate system (0-100 = search results)
    const minPosition = ((effectiveOldestTime - timeRange.minTime) / timeRange.duration) * 100;
    const maxPosition = ((effectiveNewestTime - timeRange.minTime) / timeRange.duration) * 100;
    
    return { minPosition, maxPosition };
  }, [timeRange, fullTimelineRange]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!timelineRef.current || !timeRange) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorPercent = (cursorX / rect.width) * 100;
    
    const dataPositionUnderCursor = windowStart + (cursorPercent / 100) * windowWidth;
    
    const delta = e.deltaY * -0.1;
    
    // Get effective bounds that encompass search results AND full timeline range
    const { minPosition, maxPosition } = getEffectiveBounds();
    
    // Calculate minimum zoom (maximum zoom out) to show the full effective range
    const fullWindowWidth = maxPosition - minPosition;
    const minZoom = 100 / fullWindowWidth;
    
    console.log('🔍 Zoom calculation:');
    console.log('  Search results range:', new Date(timeRange.minTime).toISOString(), 'to', new Date(timeRange.maxTime).toISOString());
    console.log('  Effective bounds - minPosition:', minPosition, 'maxPosition:', maxPosition);
    console.log('  fullWindowWidth needed:', fullWindowWidth);
    console.log('  minZoom (to show full range):', minZoom);
    console.log('  current zoom:', zoom);
    
    const newZoom = Math.max(minZoom, Math.min(10000, zoom * Math.exp(delta * 0.1)));
    const newWindowWidth = 100 / newZoom;
    
    console.log('  newZoom:', newZoom);
    console.log('  newWindowWidth:', newWindowWidth);
    
    // Blend cursor position with center position based on centerWeight
    // centerWeight = 0: zoom exactly to cursor (original behavior)
    // centerWeight = 1: zoom to screen center
    const effectiveCursorPercent = cursorPercent * (1 - centerWeight) + 50 * centerWeight;
    const newViewCenter = dataPositionUnderCursor + newWindowWidth * (0.5 - effectiveCursorPercent / 100);
    
    setZoom(newZoom);
    
    // Allow panning to show the full effective range
    const minCenter = minPosition + newWindowWidth / 2;
    const maxCenter = maxPosition - newWindowWidth / 2;
    
    // Only clamp if the window is smaller than the effective range
    if (minCenter < maxCenter) {
      setViewCenter(Math.max(minCenter, Math.min(maxCenter, newViewCenter)));
    } else {
      // Window is larger than effective range, center on the middle of the range
      setViewCenter((minPosition + maxPosition) / 2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current || !timeRange) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const delta = (e.clientX - dragStart) / rect.width * windowWidth;
    
    // Get effective bounds that encompass search results AND full timeline range
    const { minPosition, maxPosition } = getEffectiveBounds();
    
    const minCenter = minPosition + windowWidth / 2;
    const maxCenter = maxPosition - windowWidth / 2;
    
    // Only clamp if the window is smaller than the effective range
    if (minCenter < maxCenter) {
      setViewCenter(prev => Math.max(minCenter, Math.min(maxCenter, prev - delta)));
    } else {
      // Window is larger than effective range, center on the middle
      setViewCenter((minPosition + maxPosition) / 2);
    }
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const { ticks, majorTicks } = getTicks();
  const timeLabels = getTimeLabels(majorTicks);

  return (
    <div 
      className="flex-1 flex flex-col min-h-[400px]"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timeline Container */}
      <div className="flex-1 flex items-center justify-center" onWheel={handleWheel}>
        <div className="w-full">
          {allEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg mb-2">No snapshots to display</div>
              <div className="text-muted-foreground/60 text-sm">
                {searchQuery ? `No results found for "${searchQuery}"` : 'Search for memories to populate the timeline'}
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground text-center mb-1">
                Window: {getTimeframeLabel()} • {visibleEvents.length} of {allEvents.length} snapshots
                {searchQuery && <span className="text-muted-foreground/70"> • Search: "{searchQuery}"</span>}
              </div>
              {timeRange && (
                <div className="text-xs text-muted-foreground/60 text-center mb-2">
                  Data range: {new Date(timeRange.minTime).toLocaleString()} - {new Date(timeRange.maxTime).toLocaleString()}
                </div>
              )}
              <div className="text-xs text-muted-foreground/60 text-center mb-8">
                Scroll to zoom • Drag to pan
              </div>
            </>
          )}
          
          {allEvents.length > 0 && (
          <div className="relative px-12">
            {/* Timeline Track with Interaction Area */}
            <div 
              ref={timelineRef}
              onMouseMove={handleTimelineHover}
              onMouseLeave={() => setHoveredEvent(null)}
              onMouseDown={handleMouseDown}
              className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} py-16`}
            >
              <div className="relative h-1 bg-border rounded-full">
                {/* Tick Marks */}
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    style={{ left: `${tick.position}%` }}
                    className="absolute top-full translate-y-1 -translate-x-px"
                  >
                    <div 
                      className={`w-px ${tick.type === 'major' ? 'h-3 bg-muted-foreground/40' : 'h-1.5 bg-border'}`}
                    ></div>
                  </div>
                ))}
                
                {/* Event Markers */}
                {visibleEvents.map((event, index) => (
                  <div
                    key={index}
                    style={{ left: `${event.displayPosition}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  >
                    <div 
                      className="rounded-full hover:brightness-125 transition-all bg-primary"
                      style={{
                        width: `${event.calculatedSize}px`,
                        height: `${event.calculatedSize}px`,
                        opacity: event.calculatedOpacity,
                      }}
                    ></div>
                  </div>
                ))}

                {/* Hover Tooltip */}
                {hoveredEvent && !isDragging && (
                  <div
                    style={{ left: `${hoverPosition}%` }}
                    className="absolute bottom-full mb-4 -translate-x-1/2 w-64 bg-card border border-border rounded-lg p-4 shadow-xl z-10 pointer-events-none"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{hoveredEvent.date}</span>
                      <span className="text-primary font-mono">
                        {(hoveredEvent.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm font-medium text-foreground mb-1">{hoveredEvent.title}</div>
                    <div className="text-xs text-muted-foreground">{hoveredEvent.description}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Time Labels */}
            <div className="relative text-xs text-muted-foreground/60 h-4">
              {timeLabels.map((item, index) => (
                <span 
                  key={index} 
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${item.position}%` }}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

