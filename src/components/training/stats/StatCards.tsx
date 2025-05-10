
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserTraining } from "@/lib/types";
import { safeString } from '@/components/training/utils/StringUtils';

interface StatCardsProps {
  userTrainings: UserTraining[];
  categoryCounts: Record<string, number>;
}

export function StatCards({ userTrainings, categoryCounts }: StatCardsProps) {
  const totalTrainings = userTrainings.length;
  
  // Find the top category
  let topCategory = 'None';
  let topCount = 0;
  
  Object.entries(categoryCounts).forEach(([category, count]) => {
    const countAsNumber = count as number;
    if (countAsNumber > topCount) {
      topCount = countAsNumber;
      topCategory = category;
    }
  });
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrainings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Training Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{safeString(topCategory)}</div>
          {topCount > 0 && <div className="text-xs text-muted-foreground">{topCount} trainings</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(categoryCounts).length}</div>
        </CardContent>
      </Card>
    </div>
  );
}
