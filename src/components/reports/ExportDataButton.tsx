
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

interface ExportDataButtonProps {
  data: any[];
  fileName: string;
  title: string;
  columns: {
    header: string;
    accessor: string;
  }[];
}

export function ExportDataButton({ data, fileName, title, columns }: ExportDataButtonProps) {
  const handleExportExcel = () => {
    try {
      // Convert data to worksheet format
      const worksheetData = data.map(item => {
        const row: Record<string, any> = {};
        columns.forEach(column => {
          row[column.header] = item[column.accessor];
        });
        return row;
      });
      
      // Create worksheet
      const worksheet = utils.json_to_sheet(worksheetData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, title);
      
      // Generate Excel file
      const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
      const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Save file
      saveAs(fileData, `${fileName}.xlsx`);
      
      toast({
        title: "Excel export successful",
        description: `The ${title} has been exported to Excel.`,
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
      // Initialize PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      
      // Prepare table data
      const tableRows = data.map(item => {
        return columns.map(column => String(item[column.accessor] || ''));
      });
      
      // Add table
      if (tableRows.length > 0) {
        doc.autoTable({
          startY: 30,
          head: [columns.map(column => column.header)],
          body: tableRows,
          headStyles: {
            fillColor: [116, 116, 116], // Grey
            textColor: [255, 255, 255] // White
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248]
          }
        });
      } else {
        doc.text("No data available for export.", 14, 40);
      }
      
      // Save file
      doc.save(`${fileName}.pdf`);
      
      toast({
        title: "PDF export successful",
        description: `The ${title} has been exported to PDF.`,
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
