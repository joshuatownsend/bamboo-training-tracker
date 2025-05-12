
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QualificationStatus } from "@/lib/types";

interface QualificationsSummaryCardsProps {
  qualifications: QualificationStatus[];
}

export function QualificationsSummaryCards({ qualifications }: QualificationsSummaryCardsProps) {
  const countyQualifiedCount = qualifications.filter(q => q.is_qualified_county).length;
  const avfrdQualifiedCount = qualifications.filter(q => q.is_qualified_avfrd).length;
  const bothQualifiedCount = qualifications.filter(q => q.is_qualified_county && q.is_qualified_avfrd).length;
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">County Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{countyQualifiedCount} of {qualifications.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet Loudoun County requirements for</p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">AVFRD Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avfrdQualifiedCount} of {qualifications.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet AVFRD requirements for</p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-company-yellow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fully Qualified Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bothQualifiedCount} of {qualifications.length}</div>
          <p className="text-xs text-muted-foreground mt-1">Positions you meet both County and AVFRD requirements for</p>
        </CardContent>
      </Card>
    </div>
  );
}
