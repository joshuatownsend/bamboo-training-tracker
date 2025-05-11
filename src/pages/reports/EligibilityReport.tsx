
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
import { Search, AlertCircle } from "lucide-react";
import { employees, positions, trainings, trainingCompletions } from "@/lib/data";
import { checkPositionQualification } from "@/lib/qualifications";

export default function EligibilityReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    ? eligibleEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : eligibleEmployees;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteer Eligibility Report</h1>
        <p className="text-muted-foreground">
          View volunteers eligible by county standards but not yet promoted
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
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.position}</TableCell>
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
