
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { QualificationsTable } from "@/components/qualifications/QualificationsTable";
import { QualificationStatus } from "@/lib/types";

interface QualificationsTabContentProps {
  qualifications: QualificationStatus[];
  type: 'county' | 'avfrd';
  title: string;
  description: string;
}

export function QualificationsTabContent({
  qualifications,
  type,
  title,
  description
}: QualificationsTabContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <QualificationsTable qualifications={qualifications} type={type} />
      </CardContent>
    </Card>
  );
}
