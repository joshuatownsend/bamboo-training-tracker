
import React from "react";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";
import { QualificationsSummaryCards } from "@/components/qualifications/QualificationsSummaryCards";
import { QualificationsTabs } from "@/components/qualifications/QualificationsTabs";
import { QualificationsHeader } from "@/components/qualifications/QualificationsHeader";
import { useQualifications } from "@/hooks/useQualifications";

export default function MyQualifications() {
  const { qualifications, activeTab, setActiveTab, isLoading } = useQualifications();
  
  if (isLoading) {
    return <QualificationsLoadingState />;
  }

  return (
    <div className="space-y-6">
      <QualificationsHeader />
      <QualificationsSummaryCards qualifications={qualifications} />
      <QualificationsTabs 
        qualifications={qualifications}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
