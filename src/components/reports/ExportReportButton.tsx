
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
  activeTab: "county" | "avfrd";
  trainings: {
    county: Training[];
    avfrd: Training[];
  };
}

export function ExportReportButton({ position, activeTab, trainings }: ExportReportButtonProps) {
  if (!position) return null;

  const handleExportExcel = () => {
    exportToExcel(
      activeTab === "county" ? trainings.county : trainings.avfrd,
      position.title,
      activeTab
    );
  };

  const handleExportPdf = () => {
    exportToPdf(
      activeTab === "county" ? trainings.county : trainings.avfrd,
      position.title,
      activeTab
    );
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
