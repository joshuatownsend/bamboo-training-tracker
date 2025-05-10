
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserTraining } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface UserTrainingsTableProps {
  trainings: UserTraining[];
}

export function UserTrainingsTable({ trainings }: UserTrainingsTableProps) {
  // Group trainings by category for better organization
  const groupedTrainings = trainings.reduce((acc, training) => {
    const category = training.trainingDetails?.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(training);
    return acc;
  }, {} as Record<string, UserTraining[]>);

  // Get categories and sort them
  const categories = Object.keys(groupedTrainings).sort();

  // Function to open BambooHR training page for the employee
  const openInBambooHR = (employeeId: string) => {
    window.open(`https://avfrd.bamboohr.com/employees/training/?id=${employeeId}&page=2109`, '_blank');
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-1/3">Training Course</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Completion Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No training records found. Try refreshing the data.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <>
                <TableRow key={`category-${category}`} className="bg-muted/20 hover:bg-muted/20">
                  <TableCell colSpan={5} className="font-medium py-2">
                    {category}
                  </TableCell>
                </TableRow>
                {groupedTrainings[category].map((training) => (
                  <TableRow key={training.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{training.trainingDetails?.title || 'Unknown Training'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {training.trainingDetails?.description || "No description available"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/30">
                        {training.trainingDetails?.category || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {training.completionDate ? format(new Date(training.completionDate), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {training.notes || "No notes"}
                        {training.instructor && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Instructor: {training.instructor}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openInBambooHR(training.employeeId)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" /> 
                        View Training Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default UserTrainingsTable;
