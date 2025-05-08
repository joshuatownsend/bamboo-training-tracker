
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { positions, trainings, trainingCompletions } from "@/lib/data";
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
import { getAllPositionQualifications } from "@/lib/qualifications";
import { FileText } from "lucide-react";

export default function RequiredTrainings() {
  const { currentUser } = useUser();
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  
  // Get qualification status for all positions if user is logged in
  const qualifications = currentUser
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainings,
        trainingCompletions
      )
    : [];
  
  // Get the next positions to qualify for (not yet qualified for AVFRD)
  const nextPositions = qualifications.filter(q => !q.isQualifiedAVFRD);
  
  // Get selected position details
  const selectedQualification = selectedPosition
    ? qualifications.find(q => q.positionId === selectedPosition)
    : null;
  
  // Get missing trainings for the selected position
  const missingTrainings = selectedQualification?.missingAVFRDTrainings || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Required Trainings</h1>
        <p className="text-muted-foreground">
          View trainings required to qualify for additional positions
        </p>
      </div>

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
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingTrainings.map((training) => (
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
                      <TableCell>{training.durationHours} hours</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline">
                          <FileText className="mr-1 h-4 w-4" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {missingTrainings.length === 0 && (
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
              Select a position to see required trainings
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
