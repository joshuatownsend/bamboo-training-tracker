
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
    if (activeTab === "combined" && trainings.combined) {
      exportToExcel(trainings.combined, position.title, "combined");
    } else {
      exportToExcel(
        activeTab === "county" ? trainings.county : trainings.avfrd,
        position.title,
        activeTab
      );
    }
  };

  const handleExportPdf = () => {
    if (activeTab === "combined" && trainings.combined) {
      exportToPdf(trainings.combined, position.title, "combined");
    } else {
      exportToPdf(
        activeTab === "county" ? trainings.county : trainings.avfrd,
        position.title,
        activeTab
      );
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
