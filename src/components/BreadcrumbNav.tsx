'use client';

import React from 'react';
import { ChevronRight, Home, Sparkles, Brain, Film, Monitor } from 'lucide-react';

export type BreadcrumbType = 'memory' | 'episode' | 'snapshot' | 'similar';

export interface BreadcrumbItem {
  id: string;
  label: string;
  timestamp?: string;
  type?: BreadcrumbType;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
}

function getBreadcrumbIcon(type?: BreadcrumbType) {
  switch (type) {
    case 'similar':
      return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    case 'episode':
      return <Film className="w-3.5 h-3.5 text-violet-500" />;
    case 'snapshot':
      return <Monitor className="w-3.5 h-3.5 text-sky-500" />;
    case 'memory':
    default:
      return <Brain className="w-3.5 h-3.5 text-amber-500/80" />;
  }
}

export default function BreadcrumbNav({ items, onNavigate }: BreadcrumbNavProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
      >
        <Home className="w-4 h-4" />
      </button>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isSimilar = item.type === 'similar' || item.id === 'similar-search';
        
        return (
          <React.Fragment key={item.id}>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            <button
              onClick={() => onNavigate(index)}
              className={`px-2 py-1 rounded-md transition-colors flex-shrink-0 max-w-56 flex items-center gap-1.5 ${
                isLast
                  ? isSimilar
                    ? 'text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10'
                    : 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {isSimilar && <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="truncate">{item.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

