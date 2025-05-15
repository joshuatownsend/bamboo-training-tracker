
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterControls } from "@/components/reports/FilterControls";
import { QualifiedEmployeesTable } from "@/components/reports/QualifiedEmployeesTable";
import { Position } from "@/lib/types";
import { ExportDataButton } from "@/components/reports/ExportDataButton";

interface QualificationReportCardProps {
  selectedPosition: string;
  setSelectedPosition: (value: string) => void;
  positions: Position[];
  isLoadingPositions: boolean;
  requirementType: "county" | "avfrd" | "both";
  setRequirementType: (value: "county" | "avfrd" | "both") => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredEmployees: any[];
  isLoading: boolean;
}

export function QualificationReportCard({
  selectedPosition,
  setSelectedPosition,
  positions,
  isLoadingPositions,
  requirementType,
  setRequirementType,
  searchQuery,
  setSearchQuery,
  filteredEmployees,
  isLoading
}: QualificationReportCardProps) {
  const selectedPositionTitle = positions.find(p => p.id === selectedPosition)?.title || "Selected Position";
  
  const exportColumns = [
    { header: "Name", accessor: "name" },
    { header: "Position", accessor: "position" },
    { header: "Division", accessor: "division" },
    { header: "Department", accessor: "department" },
    { header: "Hire Date", accessor: "hireDate" }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Position Qualification Report</CardTitle>
          <CardDescription className="pr-8">
            Select a position to see all volunteers who are qualified for it
          </CardDescription>
        </div>
        {selectedPosition && filteredEmployees.length > 0 && (
          <ExportDataButton
            data={filteredEmployees}
            fileName={`${selectedPositionTitle}_Qualified_Volunteers`}
            title={`${selectedPositionTitle} Qualified Volunteers`}
            columns={exportColumns}
          />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <FilterControls
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          positions={positions}
          isLoadingPositions={isLoadingPositions}
          requirementType={requirementType}
          setRequirementType={setRequirementType}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        {selectedPosition ? (
          <QualifiedEmployeesTable 
            employees={filteredEmployees} 
            isLoading={isLoading} 
          />
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Select a position to view qualified volunteers
          </div>
        )}
      </CardContent>
    </Card>
  );
}
