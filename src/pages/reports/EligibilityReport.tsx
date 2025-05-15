
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkPositionQualification } from "@/lib/qualifications";
import { Employee } from "@/lib/types";
import { usePositionData } from "@/hooks/qualification/usePositionData";
import { trainings, trainingCompletions } from "@/lib/data";
import { FilterControls } from "@/components/reports/FilterControls";
import { EligibleEmployeesTable } from "@/components/reports/EligibleEmployeesTable";
import { EmployeeSearch } from "@/components/reports/EmployeeSearch";
import { ExportDataButton } from "@/components/reports/ExportDataButton";

export default function EligibilityReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd" | "both">("county");

  // Fetch positions from database - use the destructured properties directly
  const { positions, isLoading: isLoadingPositions } = usePositionData();
  
  // Fetch employees from database
  const { 
    data: employees = [], 
    isLoading: isLoadingEmployees 
  } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees
  });

  // Get employees eligible based on the selected position and requirement type
  const eligibleEmployees = getEligibleEmployees(
    employees,
    selectedPosition,
    requirementType,
    positions,
    trainings,
    trainingCompletions
  );

  // Filter by search query if provided
  const filteredEmployees = filterEmployees(eligibleEmployees, searchQuery);

  // Helper function to get qualification for an employee
  const getQualification = (employeeId: string) => {
    return checkPositionQualification(
      employeeId,
      selectedPosition,
      positions,
      trainings,
      trainingCompletions
    );
  };

  const selectedPositionTitle = positions.find(p => p.id === selectedPosition)?.title || "Selected Position";
  
  const exportColumns = [
    { header: "Name", accessor: "name" },
    { header: "Position", accessor: "position" },
    { header: "Division", accessor: "division" },
    { header: "Department", accessor: "department" },
    { header: "Hire Date", accessor: "hireDate" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteer Eligibility Report</h1>
        <p className="text-muted-foreground">
          View volunteers eligible by Loudoun County SWP 801.5 standards but not yet promoted by AVFRD
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Volunteer Eligibility Report</CardTitle>
            <CardDescription className="pr-8">
              Volunteers who meet Loudoun County requirements but not AVFRD requirements
            </CardDescription>
          </div>
          {selectedPosition && filteredEmployees.length > 0 && (
            <ExportDataButton
              data={filteredEmployees}
              fileName={`${selectedPositionTitle}_Eligible_Volunteers`}
              title={`${selectedPositionTitle} Eligible Volunteers`}
              columns={exportColumns}
            />
          )}
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
            <div className="space-y-4">
              <EmployeeSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              
              {isLoadingEmployees ? (
                <div className="space-y-2">
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <EligibleEmployeesTable
                  filteredEmployees={filteredEmployees}
                  requirementType={requirementType}
                  getQualification={getQualification}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Select a position to view eligible volunteers
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Utility functions

async function fetchEmployees() {
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
        // Convert number to string for compatibility with Employee type
        id: String(mapping.bamboo_employee_id),
        name: mapping.email.split('@')[0].replace('.', ' '),
        firstName: mapping.email.split('@')[0].split('.')[0] || '',
        lastName: mapping.email.split('@')[0].split('.')[1] || '',
        jobTitle: "Member",
        division: "Operations",
        department: "AVFRD",
        position: "Member",
        email: mapping.email,
        hireDate: mapping.created_at || ""
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
      const bambooData = employeeMap.get(String(mapping.bamboo_employee_id));
      
      return {
        id: String(mapping.bamboo_employee_id), // Convert number to string for compatibility
        name: bambooData ? `${bambooData.firstName} ${bambooData.lastName}` : mapping.email.split('@')[0].replace('.', ' '),
        firstName: bambooData?.firstName || mapping.email.split('@')[0].split('.')[0] || '',
        lastName: bambooData?.lastName || mapping.email.split('@')[0].split('.')[1] || '',
        jobTitle: bambooData?.jobTitle || "Member",
        division: bambooData?.division || "Operations",
        department: bambooData?.department || "AVFRD",
        position: bambooData?.jobTitle || "Member",
        email: mapping.email,
        hireDate: bambooData?.hireDate || mapping.created_at || ""
      };
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

function getEligibleEmployees(
  employees: Employee[],
  selectedPosition: string,
  requirementType: "county" | "avfrd" | "both",
  positions: any[],
  trainings: any[],
  trainingCompletions: any[]
) {
  if (!selectedPosition) return [];
  
  return employees.filter(employee => {
    const qualification = checkPositionQualification(
      employee.id,
      selectedPosition,
      positions,
      trainings,
      trainingCompletions
    );
    
    if (!qualification) return false;
    
    // Based on requirement type filter
    switch (requirementType) {
      case "county":
        // Employee meets county requirements but not AVFRD requirements
        return qualification.isQualifiedCounty && !qualification.isQualifiedAVFRD;
      
      case "avfrd":
        // Employee meets AVFRD requirements but not released yet (for future use)
        return qualification.isQualifiedAVFRD;
      
      case "both":
        // For "both", we might want a different condition in the future
        return qualification.isQualifiedCounty && !qualification.isQualifiedAVFRD;
      
      default:
        return qualification.isQualifiedCounty && !qualification.isQualifiedAVFRD;
    }
  });
}

function filterEmployees(employees: Employee[], searchQuery: string) {
  if (!searchQuery) return employees;
  
  return employees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchLower)) ||
      (emp.division && emp.division.toLowerCase().includes(searchLower));
  });
}
