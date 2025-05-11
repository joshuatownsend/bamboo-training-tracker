
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/services/positionService";
import { useTrainings } from "@/hooks/training/useTrainings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

export default function RequirementsReport() {
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"county" | "avfrd">("county");

  // Fetch positions from Supabase
  const { 
    data: positions = [], 
    isLoading: isLoadingPositions,
    error: positionsError
  } = useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions
  });

  // Fetch trainings from BambooHR
  const {
    trainings,
    isLoadingTrainings,
    isError: isTrainingsError,
    error: trainingsError
  } = useTrainings();

  // Get position details
  const position = positions.find(p => p.id === selectedPosition);
  
  // Get required trainings by type
  const requiredTrainings = position ? {
    county: trainings.filter(t => position.countyRequirements.includes(t.id)),
    avfrd: trainings.filter(t => position.avfrdRequirements.includes(t.id))
  } : { county: [], avfrd: [] };

  const isLoading = isLoadingPositions || isLoadingTrainings;
  const error = positionsError || trainingsError;
  const isError = !!error || isTrainingsError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training Requirements Report</h1>
        <p className="text-muted-foreground">
          View training requirements by position
        </p>
      </div>
      
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Could not load required data"}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Position Requirements</CardTitle>
          <CardDescription>
            View training requirements for each position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full sm:w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
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
              
              {selectedPosition && position ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{position.title}</h3>
                    <p className="text-sm text-muted-foreground">{position.description || "No description available"}</p>
                  </div>
                  
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "county" | "avfrd")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="county">Loudoun County Requirements</TabsTrigger>
                      <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="county" className="pt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px]">Training</TableHead>
                                <TableHead className="w-[120px]">Category</TableHead>
                                <TableHead className="w-[350px]">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requiredTrainings.county.length > 0 ? (
                                requiredTrainings.county.map(training => (
                                  <TableRow key={training.id}>
                                    <TableCell className="font-medium">{training.title}</TableCell>
                                    <TableCell>{training.category}</TableCell>
                                    <TableCell>{training.description || "No description available"}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No county requirements defined
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="avfrd" className="pt-4">
                      <Card>
                        <CardContent className="pt-6">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px]">Training</TableHead>
                                <TableHead className="w-[120px]">Category</TableHead>
                                <TableHead className="w-[350px]">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requiredTrainings.avfrd.length > 0 ? (
                                requiredTrainings.avfrd.map(training => (
                                  <TableRow key={training.id}>
                                    <TableCell className="font-medium">{training.title}</TableCell>
                                    <TableCell>{training.category}</TableCell>
                                    <TableCell>{training.description || "No description available"}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No AVFRD requirements defined
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end">
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Select a position to view training requirements
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
