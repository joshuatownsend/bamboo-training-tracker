
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
    employeeId: currentUser?.employeeId
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
  
  return (
    <div className="space-y-6">
      <QualificationsHeader />
      <QualificationsSummaryCards qualifications={safeQualifications} />
      <QualificationsTabs 
        qualifications={safeQualifications}
        activeTab={activeTab as "county" | "avfrd"} // Cast to ensure compatibility
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
