
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from "@/contexts/user";
import { useQualifications } from "@/hooks/useQualifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpRight, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";
import { MissingEmployeeIdAlert } from "@/components/training/alerts/MissingEmployeeIdAlert";
import { ExportDataButton } from "@/components/reports/ExportDataButton";

export default function MyAdvancement() {
  const { currentUser } = useUser();
  const { qualifications, isLoading, error } = useQualifications();
  
  if (isLoading) {
    return <QualificationsLoadingState />;
  }

  if (!currentUser?.employeeId) {
    return <MissingEmployeeIdAlert isAdmin={false} />;
  }

  if (error) {
    console.error("Error in MyAdvancement:", error);
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : "Failed to load advancement data. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  // Use a safe default for qualifications if it's undefined
  const safeQualifications = qualifications || [];
  
  // Filter for positions that need just a few more trainings to qualify
  // (positions where the volunteer has completed at least 50% of requirements)
  const advancementOpportunities = safeQualifications
    .filter(qual => {
      // Skip positions where the volunteer is already qualified
      if (qual.isQualifiedCounty && qual.isQualifiedAVFRD) return false;
      
      // Skip positions with no requirements
      const countyRequirements = qual.missingCountyTrainings.length;
      const avfrdRequirements = qual.missingAVFRDTrainings.length;
      const completedTrainings = qual.completedTrainings.length;
      
      // Calculate total requirements (completed + missing)
      const totalCountyRequirements = countyRequirements + 
        (qual.isQualifiedCounty ? completedTrainings : 0);
      const totalAVFRDRequirements = avfrdRequirements + 
        (qual.isQualifiedAVFRD ? completedTrainings : 0);
      
      // Skip if there are no requirements
      if (totalCountyRequirements === 0 && totalAVFRDRequirements === 0) return false;
      
      // Include if the volunteer has completed at least 50% of either requirement set
      const countyCompletion = qual.isQualifiedCounty ? 1 : 
        (1 - (countyRequirements / totalCountyRequirements));
      const avfrdCompletion = qual.isQualifiedAVFRD ? 1 : 
        (1 - (avfrdRequirements / totalAVFRDRequirements));
      
      return countyCompletion >= 0.5 || avfrdCompletion >= 0.5;
    })
    .sort((a, b) => {
      // Sort by number of missing requirements (ascending)
      const aMissing = Math.min(
        a.missingCountyTrainings.length, 
        a.missingAVFRDTrainings.length
      );
      const bMissing = Math.min(
        b.missingCountyTrainings.length, 
        b.missingAVFRDTrainings.length
      );
      return aMissing - bMissing;
    });

  // Prepare export data
  const exportData = [];
  
  for (const opportunity of advancementOpportunities) {
    // Add county requirements
    if (!opportunity.isQualifiedCounty) {
      for (const training of opportunity.missingCountyTrainings) {
        exportData.push({
          "Position": opportunity.positionTitle,
          "Requirement Type": "Loudoun County",
          "Training Name": training.title,
          "Category": training.category || "Uncategorized",
          "Training Type": training.type || "Unknown",
          "Status": "Required for Advancement"
        });
      }
    }
    
    // Add AVFRD requirements
    if (!opportunity.isQualifiedAVFRD) {
      for (const training of opportunity.missingAVFRDTrainings) {
        exportData.push({
          "Position": opportunity.positionTitle,
          "Requirement Type": "AVFRD",
          "Training Name": training.title,
          "Category": training.category || "Uncategorized",
          "Training Type": training.type || "Unknown", 
          "Status": "Required for Advancement"
        });
      }
    }
  }
  
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Advancement Opportunities</h1>
          <p className="text-muted-foreground">
            View positions you're close to qualifying for and the trainings you need
          </p>
        </div>
        <ExportDataButton 
          data={exportData}
          fileName="My_Advancement_Opportunities"
          title="My Advancement Opportunities"
          columns={exportColumns}
        />
      </div>
      
      {advancementOpportunities.length === 0 ? (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Advancement Opportunities Found</AlertTitle>
          <AlertDescription>
            You don't have any positions that you're close to qualifying for at this time.
            Continue completing trainings to unlock advancement opportunities.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {advancementOpportunities.map((opportunity) => (
            <Card key={opportunity.positionId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="text-company-yellow h-5 w-5" />
                  {opportunity.positionTitle}
                </CardTitle>
                <CardDescription>
                  <div className="flex gap-4 mt-1">
                    <Badge variant={opportunity.isQualifiedCounty ? "default" : "outline"} className="flex items-center gap-1">
                      {opportunity.isQualifiedCounty ? 
                        <CheckCircle className="h-3 w-3" /> : 
                        <XCircle className="h-3 w-3" />
                      }
                      Loudoun County
                    </Badge>
                    <Badge variant={opportunity.isQualifiedAVFRD ? "default" : "outline"} className="flex items-center gap-1">
                      {opportunity.isQualifiedAVFRD ? 
                        <CheckCircle className="h-3 w-3" /> : 
                        <XCircle className="h-3 w-3" />
                      }
                      AVFRD
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!opportunity.isQualifiedCounty && opportunity.missingCountyTrainings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Missing County Requirements:</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Training</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunity.missingCountyTrainings.map((training) => (
                            <TableRow key={`county-${opportunity.positionId}-${training.id}`}>
                              <TableCell className="font-medium">{training.title}</TableCell>
                              <TableCell>{training.category || "Uncategorized"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {!opportunity.isQualifiedAVFRD && opportunity.missingAVFRDTrainings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Missing AVFRD Requirements:</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Training</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunity.missingAVFRDTrainings.map((training) => (
                            <TableRow key={`avfrd-${opportunity.positionId}-${training.id}`}>
                              <TableCell className="font-medium">{training.title}</TableCell>
                              <TableCell>{training.category || "Uncategorized"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
