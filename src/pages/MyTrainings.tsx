
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/user";
import useBambooHR from "@/hooks/useBambooHR";
import { UserTrainingsTable } from "@/components/training/UserTrainingsTable";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/training/LoadingState";
import { ErrorState } from "@/components/training/ErrorState";
import { useTrainingFilters } from "@/hooks/useTrainingFilters";
import { StatCards } from "@/components/training/stats/StatCards";
import { SearchAndFilter } from "@/components/training/filters/SearchAndFilter";
import { PageHeader } from "@/components/training/headers/PageHeader";
import { MissingEmployeeIdAlert } from "@/components/training/alerts/MissingEmployeeIdAlert";
import { ApiErrorAlert } from "@/components/training/alerts/ApiErrorAlert";
import { SortableHeader } from "@/components/training/headers/SortableHeader";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { ExportDataButton } from "@/components/reports/ExportDataButton";

export default function MyTrainings() {
  const { currentUser, isAdmin, refreshEmployeeId } = useUser();
  const { toast } = useToast();
  
  const {
    useUserTrainings,
  } = useBambooHR();
  
  const employeeId = currentUser?.employeeId;
  
  // Log employee ID for debugging
  useEffect(() => {
    console.log("Current user:", currentUser);
    console.log("Employee ID being used for training fetch:", employeeId);
  }, [currentUser, employeeId]);
  
  const {
    data: userTrainings = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUserTrainings(employeeId);
  
  // Log fetched trainings
  useEffect(() => {
    console.log("User trainings fetched:", userTrainings);
    if (error) {
      console.error("Error fetching user trainings:", error);
    }
  }, [userTrainings, error]);

  // Use the training filters hook
  const {
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortField,
    sortDirection,
    handleSort,
    categories,
    categoryCounts,
    sortedTrainings
  } = useTrainingFilters(userTrainings);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      // Try to refresh the employee ID mapping first
      const newEmployeeId = await refreshEmployeeId();
      if (newEmployeeId && newEmployeeId !== employeeId) {
        toast({
          title: "Employee ID Updated",
          description: "Your employee ID mapping has been updated. Refreshing data...",
        });
      }
      
      // Then refetch the trainings
      await refetch();
      toast({
        title: "Refreshed Training Data",
        description: "Your training records have been refreshed.",
      });
    } catch (error) {
      toast({
        title: "Error Refreshing Data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Check if employee ID is missing
  const isMissingEmployeeId = !employeeId || employeeId === currentUser?.id;
  
  // Check if there was an API error
  const hasApiError = error !== null && error !== undefined;

  // Prepare data for export
  const exportColumns = [
    { header: "Training Name", accessor: "title" },
    { header: "Category", accessor: "category" },
    { header: "Completion Date", accessor: "completionDate" },
    { header: "Expiration Date", accessor: "expirationDate" }
  ];

  // Format data for export
  const exportData = sortedTrainings.map(training => ({
    title: training.trainingDetails?.title || `Training ${training.trainingId || training.type}`,
    category: training.trainingDetails?.category || "Uncategorized",
    completionDate: training.completionDate || "N/A",
    expirationDate: training.trainingDetails?.expirationDate || "No expiration"
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        isAdmin={isAdmin}
        isRefetching={isRefetching}
        handleRefresh={handleRefresh}
      />

      {isMissingEmployeeId && <MissingEmployeeIdAlert isAdmin={isAdmin} />}
      {hasApiError && <ApiErrorAlert error={error} />}

      <StatCards userTrainings={userTrainings} categoryCounts={categoryCounts} />

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <SearchAndFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
        />

        {!isLoading && !error && sortedTrainings.length > 0 && (
          <ExportDataButton
            data={exportData}
            fileName="My_Training_Records"
            title="Training Records"
            columns={exportColumns}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
          <CardDescription>
            These are your completed training records from BambooHR
            <div className="flex mt-2 items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by:</span>
              <div className="flex flex-wrap gap-4">
                <SortableHeader 
                  field="title" 
                  label="Training Name" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  handleSort={handleSort}
                />
                <SortableHeader 
                  field="category" 
                  label="Category" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  handleSort={handleSort}
                />
                <SortableHeader 
                  field="completionDate" 
                  label="Completion Date" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  handleSort={handleSort}
                />
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            <UserTrainingsTable trainings={sortedTrainings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
