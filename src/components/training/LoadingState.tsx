
import React from 'react';

export function LoadingState() {
  return (
    <div className="p-8 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-company-yellow mb-4"></div>
      <p className="text-muted-foreground">Loading training records...</p>
    </div>
  );
}
