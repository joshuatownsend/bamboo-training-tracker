
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import jsPDF from "jspdf";
// Add the autotable type for jsPDF
import "jspdf-autotable";
import { Training } from "@/lib/types";

// Helper function to prepare training data for export
const prepareTrainingsForExport = (
  trainings: Training[], 
  positionTitle: string, 
  requirementType: "county" | "avfrd"
) => {
  return trainings.map((training) => ({
    Training: training.title,
    Category: training.category,
    Description: training.description || "No description available",
    Position: positionTitle,
    "Requirement Type": requirementType === "county" ? "Loudoun County" : "AVFRD"
  }));
};

// Export to Excel
export const exportToExcel = (
  trainings: Training[], 
  positionTitle: string, 
  requirementType: "county" | "avfrd"
) => {
  const data = prepareTrainingsForExport(trainings, positionTitle, requirementType);
  
  // Create worksheet
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, `${requirementType.toUpperCase()} Requirements`);
  
  // Generate Excel file
  const excelBuffer = write(workbook, { bookType: "xlsx", type: "array" });
  const fileData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  // Save file
  saveAs(fileData, `${positionTitle} - ${requirementType.toUpperCase()} Requirements.xlsx`);
};

// Export to PDF
export const exportToPdf = (
  trainings: Training[], 
  positionTitle: string, 
  requirementType: "county" | "avfrd"
) => {
  // Initialize PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(`${positionTitle} - ${requirementType === "county" ? "Loudoun County" : "AVFRD"} Requirements`, 14, 20);
  doc.setFontSize(10);
  
  // Prepare table data
  const tableRows = trainings.map(training => [
    training.title,
    training.category,
    training.description || "No description available"
  ]);
  
  // Add table
  if (tableRows.length > 0) {
    (doc as any).autoTable({
      startY: 30,
      head: [["Training", "Category", "Description"]],
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
    doc.text(`No ${requirementType === "county" ? "County" : "AVFRD"} requirements defined for this position.`, 14, 40);
  }
  
  // Save file
  doc.save(`${positionTitle} - ${requirementType.toUpperCase()} Requirements.pdf`);
};
