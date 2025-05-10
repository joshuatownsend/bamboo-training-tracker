
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PageHeaderProps {
  isAdmin: boolean;
  isRefetching: boolean;
  handleRefresh: () => Promise<void>;
}

export function PageHeader({
  isAdmin,
  isRefetching,
  handleRefresh
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">My Trainings</h1>
        <p className="text-muted-foreground">
          View your completed training records from BambooHR
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
