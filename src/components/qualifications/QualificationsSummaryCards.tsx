
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QualificationStatus } from "@/lib/types";

interface QualificationsSummaryCardsProps {
  qualifications: QualificationStatus[];
}

export function QualificationsSummaryCards({ qualifications }: QualificationsSummaryCardsProps) {
  // Use safe values with fallbacks
  const safeQualifications = qualifications || [];
  const totalCount = safeQualifications.length || 0;
  
  const countyQualifiedCount = safeQualifications.filter(q => q.isQualifiedCounty).length;
  const avfrdQualifiedCount = safeQualifications.filter(q => q.isQualifiedAVFRD).length;
  const bothQualifiedCount = safeQualifications.filter(q => q.isQualifiedCounty && q.isQualifiedAVFRD).length;
  
  console.log("Rendering QualificationsSummaryCards with counts:", {
    total: totalCount,
    county: countyQualifiedCount,
    avfrd: avfrdQualifiedCount,
    both: bothQualifiedCount
  });
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">County Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{countyQualifiedCount} of {totalCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet Loudoun County requirements for</p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AVFRD Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avfrdQualifiedCount} of {totalCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet AVFRD requirements for</p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fully Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bothQualifiedCount} of {totalCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet both County and AVFRD requirements for</p>
        </CardContent>
      </Card>
    </div>
  );
}
