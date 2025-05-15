
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { QualificationStatus, Training } from "@/lib/types";
import { exportToExcel, exportToPdf } from "@/utils/exportUtils";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";

interface QualificationsExportButtonProps {
  qualifications: QualificationStatus[];
  activeTab: "county" | "avfrd" | "both";
  isLoading?: boolean;
}

interface ExportData {
  trainings: Training[];
  positionTitle: string;
  requirementType: "county" | "avfrd" | "combined";
}

export function QualificationsExportButton({ 
  qualifications, 
  activeTab,
  isLoading = false 
}: QualificationsExportButtonProps) {
  // Get training type names to display proper names instead of IDs
  const { trainingTypeNames, isLoadingNames } = useTrainingTypeNames(
    qualifications.flatMap(q => [
      ...q.missingCountyTrainings || [], 
      ...q.missingAVFRDTrainings || [], 
      ...q.completedTrainings || []
    ])
  );
  
  // Get tab name for display and filenames
  const getTabName = () => {
    switch (activeTab) {
      case "county": return "Loudoun County";
      case "avfrd": return "AVFRD";
      case "both": return "Combined";
      default: return "Qualifications";
    }
  };
  
  // Filter qualifications based on active tab
  const getFilteredQualifications = () => {
    if (activeTab === "county") {
      return qualifications.filter(q => q.isQualifiedCounty);
    } else if (activeTab === "avfrd") {
      return qualifications.filter(q => q.isQualifiedAVFRD);
    } else {
      return qualifications.filter(q => q.isQualifiedCounty && q.isQualifiedAVFRD);
    }
  };
  
  // Get relevant trainings based on tab
  const getExportTrainings = (qualification: QualificationStatus): Training[] => {
    if (activeTab === "county") {
      return qualification.missingCountyTrainings || [];
    } else if (activeTab === "avfrd") {
      return qualification.missingAVFRDTrainings || [];
    } else {
      // For both tab, include both missing training lists
      const countyMissing = qualification.missingCountyTrainings || [];
      const avfrdMissing = qualification.missingAVFRDTrainings || [];
      
      // Combine and deduplicate by ID
      const allTrainings = [...countyMissing, ...avfrdMissing];
      const uniqueIds = new Set();
      return allTrainings.filter(training => {
        if (uniqueIds.has(training.id)) {
          return false;
        }
        uniqueIds.add(training.id);
        return true;
      });
    }
  };
  
  // Format qualifications data for export
  const prepareExportData = (): ExportData => {
    const filteredQualifications = getFilteredQualifications();
    
    if (filteredQualifications.length === 0) {
      return {
        trainings: [],
        positionTitle: "My Qualifications",
        requirementType: activeTab === "both" ? "combined" : activeTab
      };
    }
    
    // Get the first qualification to use for export
    const qualification = filteredQualifications[0];
    const positionTitle = "My Qualifications";
    const requirementType = activeTab === "both" ? "combined" : activeTab;
    
    // Get trainings based on active tab
    const trainings = getExportTrainings(qualification);
    
    return { 
      trainings, 
      positionTitle, 
      requirementType 
    };
  };
  
  const handleExportExcel = () => {
    try {
      if (isLoading || isLoadingNames) {
        toast({
          title: "Please wait",
          description: "Loading qualification data for export...",
        });
        return;
      }
      
      const exportData = prepareExportData();
      
      if (!exportData.trainings || exportData.trainings.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Export to Excel - now with proper typing
      exportToExcel(
        exportData.trainings, 
        exportData.positionTitle, 
        exportData.requirementType
      );
      
      toast({
        title: "Excel export successful",
        description: `The ${getTabName()} qualifications have been exported to Excel.`,
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting to Excel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportPdf = () => {
    try {
      if (isLoading || isLoadingNames) {
        toast({
          title: "Please wait",
          description: "Loading qualification data for export...",
        });
        return;
      }
      
      const exportData = prepareExportData();
      
      if (!exportData.trainings || exportData.trainings.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Export to PDF - now with proper typing
      const success = exportToPdf(
        exportData.trainings, 
        exportData.positionTitle, 
        exportData.requirementType
      );
      
      if (success) {
        toast({
          title: "PDF export successful",
          description: `The ${getTabName()} qualifications have been exported to PDF.`,
        });
      } else {
        throw new Error("PDF export failed");
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting to PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" disabled={isLoading || isLoadingNames}>
          <FileText className="h-4 w-4" />
          Export Report
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
