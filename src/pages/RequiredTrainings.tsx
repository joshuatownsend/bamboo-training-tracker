
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { useQualifications } from "@/hooks/useQualifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { MissingEmployeeIdAlert } from "@/components/training/alerts/MissingEmployeeIdAlert";
import { Training } from "@/lib/types";

export default function RequiredTrainings() {
  const { currentUser } = useUser();
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  
  const { 
    qualifications, 
    isLoading,
    error 
  } = useQualifications();
  
  // Get the next positions to qualify for (not yet qualified for AVFRD)
  const nextPositions = qualifications.filter(q => !q.isQualifiedAVFRD);
  
  // Get selected position details
  const selectedQualification = selectedPosition
    ? qualifications.find(q => q.positionId === selectedPosition)
    : null;
  
  // Combine missing trainings from both county and AVFRD with source information
  const requiredTrainings = selectedQualification 
    ? [
        ...selectedQualification.missingCountyTrainings.map(training => ({
          ...training,
          source: 'County' as const
        })),
        ...selectedQualification.missingAVFRDTrainings
          .filter(avfrdTraining => 
            !selectedQualification.missingCountyTrainings.some(
              countyTraining => countyTraining.id === avfrdTraining.id
            )
          )
          .map(training => ({
            ...training,
            source: 'AVFRD' as const
          }))
      ]
    : [];

  // Handle missing employee ID
  if (!currentUser?.employeeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Advancement</h1>
          <p className="text-muted-foreground">
            View trainings required to qualify for additional positions
          </p>
        </div>
        <MissingEmployeeIdAlert isAdmin={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Advancement</h1>
          <p className="text-muted-foreground">
            View trainings required to qualify for additional positions
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading qualifications</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Unable to load your qualification data. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Advancement</h1>
        <p className="text-muted-foreground">
          View trainings required to qualify for additional positions
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Next Steps for Qualification</CardTitle>
            <CardDescription>
              Select a position to see which trainings you need to complete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {nextPositions.map((qualification) => (
                  <SelectItem key={qualification.positionId} value={qualification.positionId}>
                    {qualification.positionTitle}
                  </SelectItem>
                ))}
                {nextPositions.length === 0 && (
                  <SelectItem value="none" disabled>No positions available</SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedQualification && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Required Trainings for {selectedQualification.positionTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete these trainings to qualify for this position
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Training</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Requirement Source</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requiredTrainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{training.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {training.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{training.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={training.source === 'County' ? 'secondary' : 'outline'}>
                            {training.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">
                            <FileText className="mr-1 h-4 w-4" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {requiredTrainings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No additional trainings required
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {!selectedPosition && (
              <div className="text-center py-4 text-muted-foreground">
                {nextPositions.length > 0 
                  ? "Select a position to see required trainings"
                  : "You have qualified for all available positions!"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
