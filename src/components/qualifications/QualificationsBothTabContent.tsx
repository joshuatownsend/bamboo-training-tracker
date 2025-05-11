
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { QualificationsBothTable } from "./QualificationsBothTable";
import { QualificationStatus } from "@/lib/types";

interface QualificationsBothTabContentProps {
  qualifications: QualificationStatus[];
}

export function QualificationsBothTabContent({
  qualifications
}: QualificationsBothTabContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Combined Qualifications</CardTitle>
        <CardDescription>Positions you qualify for under both Loudoun County and AVFRD requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <QualificationsBothTable qualifications={qualifications} />
      </CardContent>
    </Card>
  );
}
