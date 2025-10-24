'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SearchPillProps {
  label: string;
  onRemove: () => void;
}

export default function SearchPill({ label, onRemove }: SearchPillProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-zinc-700 rounded-full pl-4 pr-2 py-2 text-sm text-zinc-100">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="bg-zinc-800 hover:bg-zinc-600 rounded-full p-1 transition-colors"
        aria-label="Remove filter"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

