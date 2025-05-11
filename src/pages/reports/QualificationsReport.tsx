
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/lib/types";
import { getEmployeesQualifiedForPosition } from "@/lib/qualifications";
import { usePositionData } from "@/hooks/qualification/usePositionData";
import { trainings, trainingCompletions } from "@/lib/data";
import { FilterControls } from "@/components/reports/FilterControls";
import { QualifiedEmployeesTable } from "@/components/reports/QualifiedEmployeesTable";

export default function QualificationsReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd">("avfrd");
  
  // Fetch positions from database
  const { positions, isLoadingPositions, positionsError } = usePositionData();
  
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
        
        // Convert mappings to employee objects with full name
        const employeeData: Employee[] = mappings.map(mapping => ({
          id: mapping.bamboo_employee_id,
          name: `${mapping.email.split('@')[0].replace('.', ' ')}`,
          firstName: mapping.email.split('@')[0].split('.')[0] || '',
          lastName: mapping.email.split('@')[0].split('.')[1] || '',
          jobTitle: "Member", // Default value - will be updated from BambooHR if available
          division: "Operations", // Default value - will be updated from BambooHR if available
          department: "AVFRD",
          position: "Member",
          email: mapping.email,
          hireDate: mapping.created_at || ""
        }));
        
        console.log(`Fetched ${employeeData.length} employees from database`);
        return employeeData;
      } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
    }
  });

  // Get qualified employees for the selected position
  const qualifiedEmployees = selectedPosition 
    ? getEmployeesQualifiedForPosition(
        selectedPosition,
        employees,
        positions,
        trainings,
        trainingCompletions,
        requirementType
      )
    : [];

  // Filter by search query if provided
  const filteredEmployees = searchQuery 
    ? qualifiedEmployees.filter(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return fullName.includes(searchLower) ||
          (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchLower)) ||
          (emp.division && emp.division.toLowerCase().includes(searchLower));
      })
    : qualifiedEmployees;

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
              isLoading={isLoadingEmployees} 
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
