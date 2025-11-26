'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  timestamp?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
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
      
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <button
            onClick={() => onNavigate(index)}
            className={`px-2 py-1 rounded-md transition-colors flex-shrink-0 max-w-48 truncate ${
              index === items.length - 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

