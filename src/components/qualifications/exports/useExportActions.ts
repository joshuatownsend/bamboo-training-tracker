
import { toast } from "@/hooks/use-toast";
import { exportToExcel, exportToPdf } from "@/utils/exportUtils";
import { Training } from "@/lib/types";

export interface ExportData {
  trainings: Training[];
  positionTitle: string;
  requirementType: "county" | "avfrd" | "combined";
}

// Hook to handle export actions
export function useExportActions(getTabName: () => string) {
  const handleExportExcel = (exportData: ExportData) => {
    try {
      if (!exportData.trainings || exportData.trainings.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Export to Excel with proper typing
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

  const handleExportPdf = (exportData: ExportData) => {
    try {
      if (!exportData.trainings || exportData.trainings.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Export to PDF with proper typing
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

  return {
    handleExportExcel,
    handleExportPdf
  };
}
