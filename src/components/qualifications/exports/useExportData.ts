
import { QualificationStatus, Training } from "@/lib/types";
import { useState } from "react";

// Hook to prepare data for export from qualifications
export function useExportData(
  qualifications: QualificationStatus[], 
  activeTab: "county" | "avfrd" | "both"
) {
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  const prepareExportData = () => {
    setIsProcessing(true);
    
    try {
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
    } catch (error) {
      console.error("Error preparing export data:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    getTabName,
    prepareExportData,
    isProcessing
  };
}
