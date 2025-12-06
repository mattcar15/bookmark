import React from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

export const ToolbarButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  children,
  title
}: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive 
        ? 'bg-accent text-foreground' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

