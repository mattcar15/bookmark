import React from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DropdownMenu = ({
  trigger,
  children,
  isOpen,
  onOpenChange,
}: DropdownMenuProps) => (
  <div className="relative">
    <div onClick={() => onOpenChange(!isOpen)}>{trigger}</div>
    {isOpen && (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => onOpenChange(false)} 
        />
        <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
          {children}
        </div>
      </>
    )}
  </div>
);

