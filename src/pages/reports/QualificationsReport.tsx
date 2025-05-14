
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/lib/types";
import { getEmployeesQualifiedForPosition } from "@/lib/qualifications";
import { usePositionData } from "@/hooks/qualification/usePositionData";
import { FilterControls } from "@/components/reports/FilterControls";
import { QualifiedEmployeesTable } from "@/components/reports/QualifiedEmployeesTable";
import { useTrainingCompletions } from "@/hooks/cache/useTrainingCompletions";
import { useTrainingsCache } from "@/hooks/cache/useTrainingsCache";
import { toast } from "@/hooks/use-toast";

export default function QualificationsReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd" | "both">("avfrd");
  
  // Fetch positions data
  const { 
    positions, 
    isLoading: isLoadingPositions, 
    error: positionsError 
  } = usePositionData();
  
  // Fetch trainings data
  const {
    data: trainings = [],
    isLoading: isLoadingTrainings,
    error: trainingsError
  } = useTrainingsCache();
  
  // Fetch training completions data
  const {
    data: trainingCompletions = [],
    isLoading: isLoadingCompletions,
    error: completionsError
  } = useTrainingCompletions();
  
  // Log data for debugging
  useEffect(() => {
    console.log("QualificationsReport - Data loaded:", {
      positionsCount: positions?.length || 0,
      trainingsCount: trainings?.length || 0,
      completionsCount: trainingCompletions?.length || 0
    });
    
    if (positionsError || trainingsError || completionsError) {
      console.error("QualificationsReport - Errors:", { 
        positionsError, 
        trainingsError, 
        completionsError 
      });
      
      toast({
        title: "Error loading data",
        description: "There was a problem loading qualification data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [
    positions, 
    trainings, 
    trainingCompletions, 
    positionsError, 
    trainingsError, 
    completionsError
  ]);
  
  // Fetch real employees from database
  const { 
    data: employees = [], 
    isLoading: isLoadingEmployees 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        // First get employee mappings
        const { data: mappings, error: mappingsError } = await supabase
          .from('employee_mappings')
          .select('*');
          
        if (mappingsError) {
          console.error("Error fetching employee mappings:", mappingsError);
          throw mappingsError;
        }

        // Attempt to fetch more detailed employee data from BambooHR
        const { data: employeeData, error: employeeError } = await supabase
          .functions.invoke('bamboohr', {
            body: { action: 'getEmployees' }
          });
          
        if (employeeError) {
          console.error("Error fetching employee data from BambooHR:", employeeError);
          // Fall back to basic data from mappings if BambooHR fetch fails
          return mappings.map(mapping => ({
            id: mapping.bamboo_employee_id.toString(), // Convert to string to match expected format
            name: mapping.name || mapping.email.split('@')[0].replace('.', ' '),
            firstName: mapping.first_name || mapping.email.split('@')[0].split('.')[0] || '',
            lastName: mapping.last_name || mapping.email.split('@')[0].split('.')[1] || '',
            jobTitle: mapping.job_title || "Member",
            division: mapping.division || "Operations",
            department: mapping.department || "AVFRD",
            position: mapping.position || "Member",
            email: mapping.email,
            hireDate: mapping.hire_date || mapping.created_at || ""
          }));
        }
        
        // Create a map of employee data from BambooHR for quick lookup
        const employeeMap = new Map();
        if (employeeData && Array.isArray(employeeData.employees)) {
          employeeData.employees.forEach((emp: any) => {
            employeeMap.set(emp.id, emp);
          });
        }
        
        // Combine mapping data with BambooHR data
        return mappings.map(mapping => {
          const bambooData = employeeMap.get(mapping.bamboo_employee_id);
          
          return {
            id: mapping.bamboo_employee_id.toString(), // Convert to string to match expected format
            name: bambooData ? `${bambooData.firstName} ${bambooData.lastName}` : (mapping.name || mapping.email.split('@')[0].replace('.', ' ')),
            firstName: bambooData?.firstName || mapping.first_name || mapping.email.split('@')[0].split('.')[0] || '',
            lastName: bambooData?.lastName || mapping.last_name || mapping.email.split('@')[0].split('.')[1] || '',
            jobTitle: bambooData?.jobTitle || mapping.job_title || "Member",
            division: bambooData?.division || mapping.division || "Operations",
            department: bambooData?.department || mapping.department || "AVFRD",
            position: bambooData?.jobTitle || mapping.position || "Member",
            email: mapping.email,
            hireDate: bambooData?.hireDate || mapping.hire_date || mapping.created_at || ""
          };
        });
      } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
    }
  });

  const isLoading = isLoadingPositions || isLoadingTrainings || isLoadingCompletions || isLoadingEmployees;
  
  // Get qualified employees for the selected position - using real data now
  const qualifiedEmployees = React.useMemo(() => {
    if (!selectedPosition || isLoading || !trainings.length || !trainingCompletions.length) {
      console.log("Cannot determine qualified employees yet:", {
        selectedPosition,
        isLoading,
        trainingsLoaded: trainings.length > 0,
        completionsLoaded: trainingCompletions.length > 0
      });
      return [];
    }
    
    console.log("Finding employees qualified for position:", selectedPosition, {
      employeesCount: employees.length,
      positionsCount: positions.length,
      trainingsCount: trainings.length,
      completionsCount: trainingCompletions.length,
    });
    
    const qualified = getEmployeesQualifiedForPosition(
      selectedPosition,
      employees,
      positions,
      trainings,
      trainingCompletions,
      requirementType
    );
    
    console.log("Found qualified employees:", qualified.length);
    return qualified;
  }, [selectedPosition, employees, positions, trainings, trainingCompletions, requirementType, isLoading]);

  // Filter by search query if provided
  const filteredEmployees = React.useMemo(() => {
    if (!searchQuery) return qualifiedEmployees;
    
    return qualifiedEmployees.filter(emp => {
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      return fullName.includes(searchLower) ||
        (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchLower)) ||
        (emp.division && emp.division.toLowerCase().includes(searchLower));
    });
  }, [qualifiedEmployees, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteer Qualification Report</h1>
        <p className="text-muted-foreground">
          View all volunteers qualified for specific positions
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Position Qualification Report</CardTitle>
          <CardDescription>
            Select a position to see all volunteers who are qualified for it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FilterControls
            selectedPosition={selectedPosition}
            setSelectedPosition={setSelectedPosition}
            positions={positions}
            isLoadingPositions={isLoadingPositions}
            requirementType={requirementType}
            setRequirementType={setRequirementType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          {selectedPosition ? (
            <QualifiedEmployeesTable 
              employees={filteredEmployees} 
              isLoading={isLoading} 
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Select a position to view qualified volunteers
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
