
import React from "react";
import { ValidationStats } from "./types";

interface ValidationStatsProps {
  stats: ValidationStats;
}

export function ValidationStatsDisplay({ stats }: ValidationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-muted rounded-lg p-4">
        <p className="text-muted-foreground text-sm">Total Completions</p>
        <p className="text-2xl font-bold">{stats.totalCompletions}</p>
      </div>
      <div className="bg-muted rounded-lg p-4">
        <p className="text-muted-foreground text-sm">Future Dates</p>
        <p className="text-2xl font-bold">{stats.futureCompletions}</p>
      </div>
      <div className="bg-muted rounded-lg p-4">
        <p className="text-muted-foreground text-sm">Pre-1990 Dates</p>
        <p className="text-2xl font-bold">{stats.pastCompletions}</p>
      </div>
    </div>
  );
}
