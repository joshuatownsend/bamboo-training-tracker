
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Training } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

  // Function to open BambooHR training in a new tab
  const openInBambooHR = (id: string) => {
    window.open(`https://avfrd.bamboohr.com/app/settings/training/edit/${id}`, '_blank');
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-1/2">Training Course</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                No training courses found. Try refreshing the data.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <>
                <TableRow key={`category-${category}`} className="bg-muted/20 hover:bg-muted/20">
                  <TableCell colSpan={3} className="font-medium py-2">
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
                      <Badge variant="outline" className="bg-muted/30">
                        {training.category || "Uncategorized"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openInBambooHR(training.id)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" /> 
                        View in BambooHR
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

export default TrainingTable;
