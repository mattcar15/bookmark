'use client';

import React, { useState, useRef, useEffect } from 'react';
import PriorityCard from './PriorityCard';
import type { Priority } from '@/types/priority.types';

interface PrioritiesProps {
  onPrioritySearch: (priorityId: string) => void;
  compact?: boolean;
}

// Placeholder priority data
const PLACEHOLDER_PRIORITIES: Priority[] = [
  {
    id: 'goal_health_fitness',
    title: 'Health & Fitness',
    description: 'Track workouts, meal plans, and progress towards fitness targets. Focus on building sustainable habits for long-term wellness.',
    color: '#10b981', // green
  },
  {
    id: 'goal_career_growth',
    title: 'Career Development',
    description: 'Professional growth objectives including skill development, networking, and career milestones. Stay focused on advancing your career trajectory.',
    color: '#3b82f6', // blue
  },
  {
    id: 'goal_creative_projects',
    title: 'Creative Projects',
    description: 'Personal creative endeavors, side projects, and artistic pursuits. Nurture your creative side and bring ideas to life.',
    color: '#8b5cf6', // purple
  },
  {
    id: 'goal_learning',
    title: 'Learning & Education',
    description: 'Continuous learning goals, courses, books, and new skills to acquire. Expand your knowledge and stay curious.',
    color: '#f59e0b', // amber
  },
];

export default function Priorities({ onPrioritySearch, compact = true }: PrioritiesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    // Show left fade if scrolled right
    setShowLeftFade(scrollLeft > 0);
    
    // Show right fade if not at the end (with 1px tolerance)
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    handleScroll();

    // Add scroll listener
    container.addEventListener('scroll', handleScroll);
    
    // Add resize listener to handle window resizing
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Left fade - only show if scrolled */}
        {showLeftFade && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right fade - only show if more content */}
        {showRightFade && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className={`flex gap-3 ${compact ? '' : 'pb-2'}`}>
            {PLACEHOLDER_PRIORITIES.map((priority) => (
              <PriorityCard
                key={priority.id}
                priority={priority}
                onSearch={onPrioritySearch}
                compact={compact}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
