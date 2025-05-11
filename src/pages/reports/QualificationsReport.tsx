
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";
import { trainings, trainingCompletions } from "@/lib/data";
import { getEmployeesQualifiedForPosition } from "@/lib/qualifications";
import { usePositionData } from "@/hooks/qualification/usePositionData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/lib/types";

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
        
        // Convert mappings to employee objects with full name instead of email-derived name
        const employeeData: Employee[] = mappings.map(mapping => ({
          id: mapping.bamboo_employee_id,
          // Create a proper full name instead of derived from email
          name: `${mapping.email.split('@')[0].replace('.', ' ')} ${mapping.email.split('@')[0].split('.')[1] || ''}`.trim(),
          // Use these fields for Position and Department columns
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
    ? qualifiedEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.division.toLowerCase().includes(searchQuery.toLowerCase())
      )
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-full sm:w-1/2">
              {isLoadingPositions ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded" />
              ) : (
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="w-full">
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
            </div>
            
            <div className="w-full sm:w-1/2">
              <Select value={requirementType} onValueChange={(value: "county" | "avfrd") => setRequirementType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select requirement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="county">Loudoun County Requirements</SelectItem>
                  <SelectItem value="avfrd">AVFRD Requirements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
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
                <div className="py-10">
                  <QualificationsLoadingState />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map(employee => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.jobTitle}</TableCell>
                          <TableCell>{employee.division}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              <span>Qualified</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No qualified volunteers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
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
