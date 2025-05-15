
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QualificationsExportButton } from "./QualificationsExportButton";
import { QualificationStatus } from "@/lib/types";

interface QualificationsHeaderProps {
  qualifications?: QualificationStatus[];
  activeTab: "county" | "avfrd" | "both";
  isLoading?: boolean;
}

export function QualificationsHeader({ 
  qualifications = [], 
  activeTab, 
  isLoading = false 
}: QualificationsHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">My Qualifications</CardTitle>
        </div>
        <QualificationsExportButton 
          qualifications={qualifications} 
          activeTab={activeTab} 
          isLoading={isLoading}
        />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          View your current qualifications for operational positions based on your training records. Switch between tabs to see your qualifications under Loudoun County requirements, AVFRD requirements, or both.
        </p>
      </CardContent>
    </Card>
  );
}
