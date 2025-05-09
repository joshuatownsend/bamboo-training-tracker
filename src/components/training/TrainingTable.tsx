
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Training } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface TrainingTableProps {
  trainings: Training[];
}

export function TrainingTable({ trainings }: TrainingTableProps) {
  // Group trainings by category for better organization
  const groupedTrainings = trainings.reduce((acc, training) => {
    const category = training.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(training);
    return acc;
  }, {} as Record<string, Training[]>);

  // Get categories and sort them
  const categories = Object.keys(groupedTrainings).sort();

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Training Course</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Required</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No training courses found. Try refreshing the data.
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
                        <div className="font-medium">{training.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {training.description || "No description available"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={training.type === "Compliance" ? "destructive" : "outline"}
                      >
                        {training.type || "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell>{training.category || "Uncategorized"}</TableCell>
                    <TableCell>{training.durationHours || 0} hours</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {training.requiredFor && training.requiredFor.length > 0 ? (
                          training.requiredFor.map((dept) => (
                            <Badge key={dept} variant="secondary" className="text-xs">
                              {dept}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Not specified</span>
                        )}
                      </div>
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

export default TrainingTable;
