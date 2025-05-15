
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Training, Position } from "@/lib/types";
import { exportToExcel, exportToPdf } from "@/utils/exportUtils";
import { toast } from "@/hooks/use-toast";

interface ExportReportButtonProps {
  position?: Position;
  activeTab: "county" | "avfrd" | "combined";
  trainings: {
    county: Training[];
    avfrd: Training[];
    combined?: Training[];
  };
}

export function ExportReportButton({ position, activeTab, trainings }: ExportReportButtonProps) {
  if (!position) return null;

  const handleExportExcel = () => {
    try {
      if (activeTab === "combined" && trainings.combined) {
        exportToExcel(trainings.combined, position.title, "combined");
      } else {
        exportToExcel(
          activeTab === "county" ? trainings.county : trainings.avfrd,
          position.title,
          activeTab
        );
      }
      toast({
        title: "Excel export successful",
        description: `The ${position.title} requirements have been exported to Excel.`,
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
      if (activeTab === "combined" && trainings.combined) {
        exportToPdf(trainings.combined, position.title, "combined");
      } else {
        exportToPdf(
          activeTab === "county" ? trainings.county : trainings.avfrd,
          position.title,
          activeTab
        );
      }
      toast({
        title: "PDF export successful",
        description: `The ${position.title} requirements have been exported to PDF.`,
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
        <Button className="gap-2">
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
