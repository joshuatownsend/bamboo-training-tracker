import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle } from "lucide-react";
import { checkPositionQualification } from "@/lib/qualifications";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePositionData } from "@/hooks/qualification/usePositionData";
import { trainings, trainingCompletions } from "@/lib/data";
import { FilterControls } from "@/components/reports/FilterControls";

export default function EligibilityReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [requirementType, setRequirementType] = useState<"county" | "avfrd" | "both">("county");

  // Fetch positions from database using the same hook as QualificationsReport
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

        // Attempt to fetch more detailed employee data from BambooHR
        const { data: employeeData, error: employeeError } = await supabase
          .functions.invoke('bamboohr', {
            body: { action: 'getEmployees' }
          });
          
        if (employeeError) {
          console.error("Error fetching employee data from BambooHR:", employeeError);
          // Fall back to basic data from mappings if BambooHR fetch fails
          return mappings.map(mapping => ({
            id: mapping.bamboo_employee_id,
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
          const bambooData = employeeMap.get(mapping.bamboo_employee_id);
          
          return {
            id: mapping.bamboo_employee_id,
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
  });

  // Get employees eligible for county standards but not AVFRD
  const eligibleEmployees = selectedPosition 
    ? employees.filter(employee => {
        const qualification = checkPositionQualification(
          employee.id,
          selectedPosition,
          positions,
          trainings,
          trainingCompletions
        );
        
        // Employee meets county requirements but not AVFRD requirements
        return qualification && qualification.isQualifiedCounty && !qualification.isQualifiedAVFRD;
      })
    : [];

  // Filter by search query if provided
  const filteredEmployees = searchQuery 
    ? eligibleEmployees.filter(emp => {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return fullName.includes(searchLower) ||
          (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchLower)) ||
          (emp.division && emp.division.toLowerCase().includes(searchLower));
      })
    : eligibleEmployees;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteer Eligibility Report</h1>
        <p className="text-muted-foreground">
          View volunteers eligible by Loudoun County SWP 801.5 standards but not yet promoted by AVFRD
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Volunteer Eligibility Report</CardTitle>
          <CardDescription>
            Volunteers who meet Loudoun County requirements but not AVFRD requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingPositions ? (
            <div className="h-10 w-full sm:w-1/2 bg-muted animate-pulse rounded" />
          ) : (
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full sm:w-1/2">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(position => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {selectedPosition ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search volunteers..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {isLoadingEmployees ? (
                <div className="space-y-2">
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Current Position</TableHead>
                      <TableHead className="w-[300px]">Missing AVFRD Requirements</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(employee => {
                        const qualification = checkPositionQualification(
                          employee.id,
                          selectedPosition,
                          positions,
                          trainings,
                          trainingCompletions
                        );
                        
                        return (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </TableCell>
                            <TableCell>{employee.jobTitle}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {qualification?.missingAVFRDTrainings.map((training) => (
                                  <Badge key={training.id} variant="outline">
                                    {training.title}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center text-amber-500">
                                <AlertCircle className="mr-1 h-4 w-4" />
                                <span>Eligible</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No eligible volunteers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
