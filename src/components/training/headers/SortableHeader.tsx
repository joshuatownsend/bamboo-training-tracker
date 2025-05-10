
import React from 'react';
import { ChevronUp, ChevronDown } from "lucide-react";

interface SortableHeaderProps {
  field: string;
  label: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string, direction: 'asc' | 'desc') => void;
}

export function SortableHeader({ 
  field, 
  label, 
  sortField, 
  sortDirection, 
  handleSort 
}: SortableHeaderProps) {
  const isActive = sortField === field;
  
  const handleHeaderClick = () => {
    if (isActive) {
      // Toggle direction if already sorting by this field
      handleSort(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending order when selecting a new field
      handleSort(field, 'asc');
    }
  };
  
  return (
    <div className="flex items-center gap-1 cursor-pointer" onClick={handleHeaderClick}>
      <span>{label}</span>
      {isActive && (
        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </div>
  );
}
