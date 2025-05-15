
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { QualificationStatus } from "@/lib/types";
import { ExportMenuItem } from "./ExportMenuItem";
import { useExportData } from "./useExportData";
import { useExportActions } from "./useExportActions";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";

interface QualificationsExportButtonProps {
  qualifications: QualificationStatus[];
  activeTab: "county" | "avfrd" | "both";
  isLoading?: boolean;
}

export function QualificationsExportButton({ 
  qualifications, 
  activeTab,
  isLoading = false 
}: QualificationsExportButtonProps) {
  // Get training type names to display proper names instead of IDs
  const { isLoadingNames } = useTrainingTypeNames(
    qualifications.flatMap(q => [
      ...q.missingCountyTrainings || [], 
      ...q.missingAVFRDTrainings || [], 
      ...q.completedTrainings || []
    ])
  );
  
  // Use our custom hooks for data preparation and export actions
  const { getTabName, prepareExportData, isProcessing } = useExportData(qualifications, activeTab);
  const { handleExportExcel, handleExportPdf } = useExportActions(getTabName);
  
  // Handle Excel export button click
  const onExportExcel = () => {
    if (isLoading || isLoadingNames || isProcessing) {
      toast({
        title: "Please wait",
        description: "Loading qualification data for export...",
      });
      return;
    }
    
    const exportData = prepareExportData();
    handleExportExcel(exportData);
  };

  // Handle PDF export button click
  const onExportPdf = () => {
    if (isLoading || isLoadingNames || isProcessing) {
      toast({
        title: "Please wait",
        description: "Loading qualification data for export...",
      });
      return;
    }
    
    const exportData = prepareExportData();
    handleExportPdf(exportData);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" disabled={isLoading || isLoadingNames || isProcessing}>
          <FileText className="h-4 w-4" />
          Export Report
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <ExportMenuItem 
          icon={FileSpreadsheet} 
          label="Export as Excel" 
          onClick={onExportExcel} 
        />
        <ExportMenuItem 
          icon={FileText} 
          label="Export as PDF" 
          onClick={onExportPdf} 
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
