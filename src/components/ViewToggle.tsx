'use client';

import React from 'react';
import { Clock, LayoutList, FileText } from 'lucide-react';

export type ViewMode = 'timeline' | 'chronological' | 'notes';

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center bg-muted/40 rounded-lg p-1 gap-1">
      <button
        onClick={() => onViewChange('timeline')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
          activeView === 'timeline'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>Timeline</span>
      </button>
      <button
        onClick={() => onViewChange('chronological')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
          activeView === 'chronological'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutList className="w-4 h-4" />
        <span>Recent</span>
      </button>
      <button
        onClick={() => onViewChange('notes')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
          activeView === 'notes'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Notes</span>
      </button>
    </div>
  );
}

