
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
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { QualificationStatus } from "@/lib/types";
import { useTrainingTypeNames } from "@/hooks/useTrainingTypeNames";

// Explicitly declare jsPDF augmentation for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  
  // Format qualifications data for export
  const prepareExportData = () => {
    const filteredQualifications = getFilteredQualifications();
    
    return filteredQualifications.map(qualification => {
      const missingTrainings = activeTab === "county" 
        ? qualification.missingCountyTrainings 
        : activeTab === "avfrd" 
          ? qualification.missingAVFRDTrainings
          : [];
          
      // Format missing training names
      const missingTrainingNames = missingTrainings
        ?.map(training => training.title || trainingTypeNames[training.id] || `Training ${training.id}`)
        .join(", ") || "None";
        
      return {
        Position: qualification.positionTitle,
        Status: activeTab === "both" || 
          (activeTab === "county" && qualification.isQualifiedCounty) ||
          (activeTab === "avfrd" && qualification.isQualifiedAVFRD)
          ? "Qualified" : "Not Qualified",
        "Missing Requirements": missingTrainingNames
      };
    });
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
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Create worksheet
      const worksheet = utils.json_to_sheet(exportData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, getTabName());
      
      // Generate Excel file
      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
      const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Save file
      const fileName = `My ${getTabName()} Qualifications`;
      saveAs(fileData, `${fileName}.xlsx`);
      
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
      
      if (exportData.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no qualifications available to export for this view.",
        });
        return;
      }
      
      // Initialize PDF document
      const doc = new jsPDF();
      
      // Add title
      const title = `My ${getTabName()} Qualifications`;
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      
      // Prepare table data
      const tableHeaders = ["Position", "Status", "Missing Requirements"];
      const tableRows = exportData.map(item => [
        item.Position,
        item.Status,
        item["Missing Requirements"]
      ]);
      
      // Add table
      try {
        doc.autoTable({
          startY: 30,
          head: [tableHeaders],
          body: tableRows,
          headStyles: {
            fillColor: [116, 116, 116], // Grey
            textColor: [255, 255, 255] // White
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248]
          },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 'auto' }
          },
          // Set word wrap to handle long text
          styles: { 
            overflow: 'linebreak',
            cellPadding: 3
          },
          // Add error handling
          didDrawCell: (data) => {
            if (data.row.index === 0) {
              console.log("Drew header cell:", data.column.index, tableHeaders[data.column.index]);
            }
          }
        });
      } catch (autoTableError) {
        console.error("PDF autoTable error:", autoTableError);
        throw new Error(`Error in autoTable: ${autoTableError.message}`);
      }
      
      // Save file
      doc.save(`${title}.pdf`);
      
      toast({
        title: "PDF export successful",
        description: `The ${getTabName()} qualifications have been exported to PDF.`,
      });
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
