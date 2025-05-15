
import React from "react";
import { QualificationReportHeader } from "@/components/reports/QualificationReportHeader";
import { QualificationReportCard } from "@/components/reports/QualificationReportCard";
import { useQualificationsReport } from "@/hooks/reports/useQualificationsReport";

export default function QualificationsReport() {
  const {
    selectedPosition,
    setSelectedPosition,
    searchQuery,
    setSearchQuery,
    requirementType,
    setRequirementType,
    positions,
    isLoadingPositions,
    filteredEmployees,
    isLoading,
  } = useQualificationsReport();

  return (
    <div className="space-y-6">
      <QualificationReportHeader />
      
      <QualificationReportCard
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        positions={positions}
        isLoadingPositions={isLoadingPositions}
        requirementType={requirementType}
        setRequirementType={setRequirementType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredEmployees={filteredEmployees}
        isLoading={isLoading}
      />
    </div>
  );
}
