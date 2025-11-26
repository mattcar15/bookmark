'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SearchPillProps {
  label: string;
  onRemove: () => void;
}

export default function SearchPill({ label, onRemove }: SearchPillProps) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-transparent border border-border rounded-full pl-3 pr-1.5 py-1 text-xs text-foreground">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-muted/50 rounded-full p-0.5 transition-colors"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

