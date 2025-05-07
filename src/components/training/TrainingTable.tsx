
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Training } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface TrainingTableProps {
  trainings: Training[];
}

export function TrainingTable({ trainings }: TrainingTableProps) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Training Course</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Required For</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainings.map((training) => (
            <TableRow key={training.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{training.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {training.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={training.type === "Compliance" ? "destructive" : "outline"}
                >
                  {training.type}
                </Badge>
              </TableCell>
              <TableCell>{training.category}</TableCell>
              <TableCell>{training.durationHours} hours</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {training.requiredFor.map((dept) => (
                    <Badge key={dept} variant="secondary" className="text-xs">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TrainingTable;
