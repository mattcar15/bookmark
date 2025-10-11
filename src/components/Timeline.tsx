'use client';

import React, { useState, useRef } from 'react';
import type { Snapshot } from '@/types/memoir-api.types';

interface TimelineEvent {
  date: string;
  position: number;
  title: string;
  description: string;
  prominence: number;
  displayPosition?: number;
  snapshot?: Snapshot;
}

interface TimelineProps {
  snapshots: Snapshot[];
  searchQuery: string;
  startingWindow: string;
  fullTimelineRange: { start: Date; end: Date } | null;
}

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
        
        // Use similarity score as prominence (0-1 -> 1-10)
        const prominence = snapshot.similarity 
          ? Math.max(1, Math.min(10, snapshot.similarity * 10))
          : 5;

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

  const visibleEvents = allEvents
    .filter(e => e.position >= windowStart && e.position <= windowEnd)
    .sort((a, b) => b.prominence - a.prominence)
    .slice(0, 30)
    .map(e => ({
      ...e,
      displayPosition: ((e.position - windowStart) / windowWidth) * 100
    }));

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

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!timelineRef.current || !timeRange || !fullTimelineRange) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorPercent = (cursorX / rect.width) * 100;
    
    const dataPositionUnderCursor = windowStart + (cursorPercent / 100) * windowWidth;
    
    const delta = e.deltaY * -0.1;
    
    // Calculate minimum zoom (maximum zoom out) to show full timeline range
    // Positions 0-100 represent the search results (timeRange.minTime to timeRange.maxTime)
    // We need to calculate what positions the full timeline range occupies
    const oldestTimestamp = fullTimelineRange.start.getTime();
    const nowTimestamp = fullTimelineRange.end.getTime();
    
    // Calculate positions of oldest and now in the data coordinate system (0-100 = search results)
    const oldestPosition = (oldestTimestamp - timeRange.minTime) / timeRange.duration * 100;
    const nowPosition = (nowTimestamp - timeRange.minTime) / timeRange.duration * 100;
    
    // The window width needed to show from oldest to now
    const fullWindowWidth = nowPosition - oldestPosition;
    const minZoom = 100 / fullWindowWidth;
    
    console.log('🔍 Zoom calculation:');
    console.log('  Search results range:', new Date(timeRange.minTime).toISOString(), 'to', new Date(timeRange.maxTime).toISOString());
    console.log('  Full timeline range:', fullTimelineRange.start.toISOString(), 'to', fullTimelineRange.end.toISOString());
    console.log('  oldestPosition:', oldestPosition);
    console.log('  nowPosition:', nowPosition);
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
    
    // Allow panning to show the full timeline range
    // Center can be positioned so that window covers oldest to now
    const minCenter = oldestPosition + newWindowWidth / 2;
    const maxCenter = nowPosition - newWindowWidth / 2;
    setViewCenter(Math.max(minCenter, Math.min(maxCenter, newViewCenter)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current || !timeRange || !fullTimelineRange) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const delta = (e.clientX - dragStart) / rect.width * windowWidth;
    
    // Calculate pan limits based on full timeline range
    const oldestTimestamp = fullTimelineRange.start.getTime();
    const nowTimestamp = fullTimelineRange.end.getTime();
    const oldestPosition = (oldestTimestamp - timeRange.minTime) / timeRange.duration * 100;
    const nowPosition = (nowTimestamp - timeRange.minTime) / timeRange.duration * 100;
    
    const minCenter = oldestPosition + windowWidth / 2;
    const maxCenter = nowPosition - windowWidth / 2;
    setViewCenter(prev => Math.max(minCenter, Math.min(maxCenter, prev - delta)));
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const { ticks, majorTicks } = getTicks();
  const timeLabels = getTimeLabels(majorTicks);

  return (
    <div 
      className="flex-1 flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Timeline Container */}
      <div className="flex-1 flex items-center" onWheel={handleWheel}>
        <div className="w-full">
          {allEvents.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-zinc-500 text-lg mb-2">No snapshots to display</div>
              <div className="text-zinc-600 text-sm">
                {searchQuery ? `No results found for "${searchQuery}"` : 'Search for memories to populate the timeline'}
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-zinc-400 text-center mb-1">
                Window: {getTimeframeLabel()} • {visibleEvents.length} of {allEvents.length} snapshots
                {searchQuery && <span className="text-zinc-500"> • Search: "{searchQuery}"</span>}
              </div>
              {timeRange && (
                <div className="text-xs text-zinc-600 text-center mb-2">
                  Data range: {new Date(timeRange.minTime).toLocaleString()} - {new Date(timeRange.maxTime).toLocaleString()}
                </div>
              )}
              <div className="text-xs text-zinc-600 text-center mb-8">
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
              <div className="relative h-1 bg-zinc-800 rounded-full">
                {/* Tick Marks */}
                {ticks.map((tick, i) => (
                  <div
                    key={i}
                    style={{ left: `${tick.position}%` }}
                    className="absolute top-full translate-y-1 -translate-x-px"
                  >
                    <div 
                      className={`w-px ${tick.type === 'major' ? 'h-3 bg-zinc-600' : 'h-1.5 bg-zinc-700'}`}
                    ></div>
                  </div>
                ))}
                
                {/* Event Markers */}
                {visibleEvents.map((event, index) => {
                  // Calculate actual window duration in milliseconds
                  const startDate = positionToDate(windowStart);
                  const endDate = positionToDate(windowEnd);
                  const windowDurationMs = endDate.getTime() - startDate.getTime();
                  
                  // Convert to hours for easier calculation
                  const windowHours = windowDurationMs / (60 * 60 * 1000);
                  
                  // Define min/max window sizes and circle sizes
                  const MIN_WINDOW_HOURS = 1; // 1 hour - most zoomed in
                  // Max window is the full timeline range from first snapshot to now
                  const maxWindowMs = fullTimelineRange 
                    ? fullTimelineRange.end.getTime() - fullTimelineRange.start.getTime()
                    : 365 * 24 * 60 * 60 * 1000; // fallback to 1 year
                  const MAX_WINDOW_HOURS = maxWindowMs / (60 * 60 * 1000);
                  const MIN_CIRCLE_SIZE = 6; // pixels - at max zoom out
                  const MAX_CIRCLE_SIZE = 20; // pixels - at 1 hour zoom
                  
                  // Clamp window hours to our range
                  const clampedWindowHours = Math.max(MIN_WINDOW_HOURS, Math.min(MAX_WINDOW_HOURS, windowHours));
                  
                  // Linear interpolation: smaller window (more zoom) = larger circles
                  // At 1 hour window: max circle size
                  // At max window: min circle size
                  const ratio = (clampedWindowHours - MIN_WINDOW_HOURS) / (MAX_WINDOW_HOURS - MIN_WINDOW_HOURS);
                  const size = MAX_CIRCLE_SIZE - ratio * (MAX_CIRCLE_SIZE - MIN_CIRCLE_SIZE);
                  
                  return (
                    <div
                      key={index}
                      style={{ left: `${event.displayPosition}%` }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    >
                      <div 
                        className="rounded-full hover:bg-zinc-400 transition-colors"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: `rgb(${100 + event.prominence * 15}, ${100 + event.prominence * 10}, ${100 + event.prominence * 10})`
                        }}
                      ></div>
                    </div>
                  );
                })}

                {/* Hover Tooltip */}
                {hoveredEvent && !isDragging && (
                  <div
                    style={{ left: `${hoverPosition}%` }}
                    className="absolute bottom-full mb-4 -translate-x-1/2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg p-4 shadow-xl z-10 pointer-events-none"
                  >
                    <div className="text-xs text-zinc-500 mb-1">{hoveredEvent.date}</div>
                    <div className="text-sm font-medium text-zinc-100 mb-1">{hoveredEvent.title}</div>
                    <div className="text-xs text-zinc-400">{hoveredEvent.description}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Time Labels */}
            <div className="relative text-xs text-zinc-600 h-4">
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

