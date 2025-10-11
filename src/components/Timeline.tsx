'use client';

import React, { useState, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function Timeline() {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [startingWindow, setStartingWindow] = useState('week');
  
  // Calculate initial zoom based on starting window
  const getZoomForWindow = (window) => {
    const totalDays = 5 * 365; // ~5 years
    switch(window) {
      case 'hour': return totalDays * 24; // ~43800
      case 'day': return totalDays; // ~1825
      case 'week': return totalDays / 7; // ~260
      case 'month': return totalDays / 30; // ~60
      case 'year': return 5; // 5
      default: return 260;
    }
  };
  
  const [zoom, setZoom] = useState(getZoomForWindow(startingWindow));
  const [viewCenter, setViewCenter] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timelineRef = useRef(null);
  const filtersRef = useRef(null);

  // Events with prominence (1-10, 10 being most important)
  const allEvents = [
    { date: '2020-01-15', position: 1, title: 'Project Kickoff', description: 'Initial planning and team formation', prominence: 8 },
    { date: '2020-02-20', position: 4, title: 'Team Expansion', description: 'Hired key engineers', prominence: 3 },
    { date: '2020-04-10', position: 15, title: 'First Prototype', description: 'MVP development completed', prominence: 7 },
    { date: '2020-06-05', position: 22, title: 'Design System', description: 'UI/UX framework established', prominence: 4 },
    { date: '2020-08-12', position: 30, title: 'Beta Release', description: 'Limited user testing began', prominence: 6 },
    { date: '2020-11-28', position: 40, title: 'Bug Fixes', description: 'Major stability improvements', prominence: 2 },
    { date: '2021-02-14', position: 45, title: 'Public Launch', description: 'Official product release', prominence: 10 },
    { date: '2021-04-22', position: 50, title: 'First 10K Users', description: 'Reached initial user milestone', prominence: 5 },
    { date: '2021-07-08', position: 55, title: 'Series A', description: '$5M funding raised', prominence: 9 },
    { date: '2021-10-15', position: 60, title: 'New Features', description: 'Added collaboration tools', prominence: 4 },
    { date: '2022-01-10', position: 65, title: 'International', description: 'Entered EU markets', prominence: 8 },
    { date: '2022-05-18', position: 70, title: 'API Launch', description: 'Developer platform released', prominence: 6 },
    { date: '2022-09-03', position: 75, title: '1M Users', description: 'Major milestone achieved', prominence: 9 },
    { date: '2022-12-20', position: 78, title: 'Year End Update', description: 'Platform improvements', prominence: 3 },
    { date: '2023-03-12', position: 82, title: 'Mobile App', description: 'iOS and Android launch', prominence: 7 },
    { date: '2023-06-25', position: 85, title: 'Security Audit', description: 'Passed SOC 2 compliance', prominence: 5 },
    { date: '2023-11-08', position: 88, title: 'Series B', description: '$20M funding raised', prominence: 10 },
    { date: '2024-02-14', position: 91, title: 'Enterprise Plan', description: 'B2B offering launched', prominence: 6 },
    { date: '2024-05-20', position: 94, title: 'AI Features', description: 'Machine learning integration', prominence: 8 },
    { date: '2024-08-10', position: 97, title: 'Partnerships', description: 'Strategic alliances formed', prominence: 4 },
    { date: '2024-10-01', position: 100, title: 'Present', description: 'Continued growth and expansion', prominence: 7 },
  ];

  const windowWidth = 100 / zoom;
  const windowStart = Math.max(0, viewCenter - windowWidth / 2);
  const windowEnd = Math.min(100, viewCenter + windowWidth / 2);

  const visibleEvents = allEvents
    .filter(e => e.position >= windowStart && e.position <= windowEnd)
    .sort((a, b) => b.prominence - a.prominence)
    .slice(0, 15)
    .map(e => ({
      ...e,
      displayPosition: ((e.position - windowStart) / windowWidth) * 100
    }));

  const positionToDate = (position) => {
    const startDate = new Date('2020-01-01T00:00:00');
    const endDate = new Date('2024-10-01T00:00:00');
    const totalTime = endDate - startDate;
    const time = startDate.getTime() + (position / 100) * totalTime;
    return new Date(time);
  };

  const getTimeLabels = () => {
    const labels = [];
    const numLabels = 5;
    
    const startDate = positionToDate(windowStart);
    const endDate = positionToDate(windowEnd);
    
    for (let i = 0; i < numLabels; i++) {
      const fraction = i / (numLabels - 1);
      const time = startDate.getTime() + fraction * (endDate.getTime() - startDate.getTime());
      const date = new Date(time);
      
      let label;
      if (zoom < 10) {
        label = date.getFullYear().toString();
      } else if (zoom < 52) {
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (zoom < 365) {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (zoom < 8760) {
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        label = `${dateStr} ${timeStr}`;
      } else {
        label = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      
      labels.push(label);
    }
    
    return labels;
  };

  const getTicks = () => {
    const startDate = positionToDate(windowStart);
    const endDate = positionToDate(windowEnd);
    const windowDuration = endDate - startDate;
    const ticks = [];
    
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
    
    // Generate major ticks
    let time = Math.floor(startDate.getTime() / majorInterval) * majorInterval;
    while (time <= endDate.getTime()) {
      const timelineStart = new Date('2020-01-01T00:00:00').getTime();
      const timelineEnd = new Date('2024-10-01T00:00:00').getTime();
      const dataPosition = ((time - timelineStart) / (timelineEnd - timelineStart)) * 100;
      
      if (dataPosition >= windowStart && dataPosition <= windowEnd) {
        const displayPosition = ((dataPosition - windowStart) / windowWidth) * 100;
        ticks.push({ position: displayPosition, type: 'major' });
      }
      time += majorInterval;
    }
    
    // Generate minor ticks
    time = Math.floor(startDate.getTime() / minorInterval) * minorInterval;
    while (time <= endDate.getTime()) {
      const isMajor = time % majorInterval === 0;
      if (!isMajor) {
        const timelineStart = new Date('2020-01-01T00:00:00').getTime();
        const timelineEnd = new Date('2024-10-01T00:00:00').getTime();
        const dataPosition = ((time - timelineStart) / (timelineEnd - timelineStart)) * 100;
        
        if (dataPosition >= windowStart && dataPosition <= windowEnd) {
          const displayPosition = ((dataPosition - windowStart) / windowWidth) * 100;
          ticks.push({ position: displayPosition, type: 'minor' });
        }
      }
      time += minorInterval;
    }
    
    return ticks;
  };

  const getTimeframeLabel = () => {
    const totalDays = (5 * 365) / zoom;
    
    if (totalDays >= 365) {
      return `${(totalDays / 365).toFixed(1)} years`;
    } else if (totalDays >= 30) {
      return `${(totalDays / 30).toFixed(1)} months`;
    } else if (totalDays >= 1) {
      return `${totalDays.toFixed(1)} days`;
    } else {
      return `${(totalDays * 24).toFixed(1)} hours`;
    }
  };

  const handleTimelineHover = (e) => {
    if (!timelineRef.current || isDragging) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    const closest = visibleEvents.reduce((prev, curr) => {
      return Math.abs(curr.displayPosition - percentage) < Math.abs(prev.displayPosition - percentage) ? curr : prev;
    }, visibleEvents[0]);
    
    if (closest && Math.abs(closest.displayPosition - percentage) < 3) {
      setHoveredEvent(closest);
      setHoverPosition(percentage);
    } else {
      setHoveredEvent(null);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorPercent = (cursorX / rect.width) * 100;
    
    const dataPositionUnderCursor = windowStart + (cursorPercent / 100) * windowWidth;
    
    const delta = e.deltaY * -0.1;
    const newZoom = Math.max(1, Math.min(10000, zoom * Math.exp(delta * 0.1)));
    const newWindowWidth = 100 / newZoom;
    
    const newViewCenter = dataPositionUnderCursor + newWindowWidth * (0.5 - cursorPercent / 100);
    
    setZoom(newZoom);
    setViewCenter(Math.max(newWindowWidth / 2, Math.min(100 - newWindowWidth / 2, newViewCenter)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const delta = (e.clientX - dragStart) / rect.width * windowWidth;
    setViewCenter(prev => Math.max(windowWidth / 2, Math.min(100 - windowWidth / 2, prev - delta)));
    setDragStart(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Close filters when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const timeLabels = getTimeLabels();
  const ticks = getTicks();

  return (
    <div 
      className="flex-1 flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with Filters */}
      <div className="flex items-center justify-end mb-8">
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-md border border-zinc-800 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-zinc-300" />
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
                    setZoom(getZoomForWindow(e.target.value));
                  }}
                  className="w-full bg-zinc-800 text-zinc-300 text-sm rounded-md px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                >
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

      {/* Timeline Container */}
      <div className="flex-1 flex items-center" onWheel={handleWheel}>
        <div className="w-full">
          <div className="text-sm text-zinc-400 text-center mb-2">
            Window: {getTimeframeLabel()} • {visibleEvents.length} events
          </div>
          <div className="text-xs text-zinc-600 text-center mb-8">
            Scroll to zoom • Drag to pan
          </div>
          
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
                  const baseSize = Math.max(8, event.prominence);
                  
                  // Calculate actual window duration in milliseconds
                  const startDate = positionToDate(windowStart);
                  const endDate = positionToDate(windowEnd);
                  const windowDurationMs = endDate - startDate;
                  
                  // Convert to hours for easier calculation
                  const windowHours = windowDurationMs / (60 * 60 * 1000);
                  const yearInHours = 365 * 24; // ~8760 hours
                  
                  // Logarithmic scale from year view to hour view
                  // At year view (8760 hours): small
                  // At hour view (1 hour): 5x larger
                  const logWindow = Math.log(windowHours);
                  const logMin = Math.log(1); // 1 hour
                  const logMax = Math.log(yearInHours * 5); // 5 years
                  const normalizedLog = (logMax - logWindow) / (logMax - logMin);
                  const sizeMultiplier = 1 + normalizedLog * 4; // 1x to 5x
                  
                  const size = baseSize * sizeMultiplier;
                  
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
            <div className="flex justify-between text-xs text-zinc-600 px-2">
              {timeLabels.map((label, index) => (
                <span key={index} className="text-center">{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

