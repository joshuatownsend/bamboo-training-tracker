
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";
import { QualificationsSummaryCards } from "@/components/qualifications/QualificationsSummaryCards";
import { QualificationsTabs } from "@/components/qualifications/QualificationsTabs";
import { QualificationsHeader } from "@/components/qualifications/QualificationsHeader";
import { useQualifications } from "@/hooks/useQualifications";
import { MissingEmployeeIdAlert } from "@/components/training/alerts/MissingEmployeeIdAlert";
import { useUser } from "@/contexts/user";
import { ExportDataButton } from "@/components/reports/ExportDataButton";

export default function MyQualifications() {
  const { currentUser } = useUser();
  const { 
    qualifications, 
    activeTab, 
    setActiveTab, 
    isLoading, 
    error 
  } = useQualifications();
  
  console.log("MyQualifications rendering with:", { 
    isLoading, 
    hasError: !!error,
    qualificationCount: qualifications?.length || 0,
    currentUser: !!currentUser,
    employeeId: currentUser?.employeeId,
    activeTab
  });
  
  if (isLoading) {
    return <QualificationsLoadingState />;
  }

  if (!currentUser?.employeeId) {
    // Add isAdmin prop with a default value of false
    return <MissingEmployeeIdAlert isAdmin={false} />;
  }

  if (error) {
    console.error("Error in MyQualifications:", error);
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : "Failed to load qualification data. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  // Use a safe default for qualifications if it's undefined
  const safeQualifications = qualifications || [];
  
  // Prepare export data based on active tab
  const prepareExportData = () => {
    const exportData = [];
    
    for (const qualification of safeQualifications) {
      let requiredTrainings = [];
      
      if (activeTab === "county") {
        requiredTrainings = qualification.missingCountyTrainings;
      } else if (activeTab === "avfrd") {
        requiredTrainings = qualification.missingAVFRDTrainings;
      } else {
        // For "both" tab, combine both sets of missing trainings
        requiredTrainings = [
          ...qualification.missingCountyTrainings,
          ...qualification.missingAVFRDTrainings
        ];
      }
      
      for (const training of requiredTrainings) {
        exportData.push({
          "Position": qualification.positionTitle,
          "Requirement Type": activeTab === "county" ? "Loudoun County" : 
                            activeTab === "avfrd" ? "AVFRD" : "Combined",
          "Training Name": training.title,
          "Category": training.category || "Uncategorized",
          "Training Type": training.type || "Unknown",
          "Status": "Required"
        });
      }
    }
    
    return exportData;
  };
  
  const exportData = prepareExportData();
  
  // Define columns for export
  const exportColumns = [
    { header: "Position", accessor: "Position" },
    { header: "Requirement Type", accessor: "Requirement Type" },
    { header: "Training Name", accessor: "Training Name" },
    { header: "Category", accessor: "Category" },
    { header: "Training Type", accessor: "Training Type" },
    { header: "Status", accessor: "Status" }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <QualificationsHeader />
        <ExportDataButton 
          data={exportData}
          fileName={`My_Qualifications_${activeTab.toUpperCase()}`}
          title={`My Qualifications - ${activeTab === "county" ? "Loudoun County" : 
                    activeTab === "avfrd" ? "AVFRD" : "Combined"} Requirements`}
          columns={exportColumns}
        />
      </div>
      <QualificationsSummaryCards qualifications={safeQualifications} />
      <QualificationsTabs 
        qualifications={safeQualifications}
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
