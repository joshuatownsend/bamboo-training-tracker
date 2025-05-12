
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Training } from "@/lib/types";

interface TrainingRequirementsTableProps {
  requiredTrainings: (Training & { source: 'County' | 'AVFRD' })[];
}

export function TrainingRequirementsTable({ requiredTrainings }: TrainingRequirementsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Training</TableHead>
          <TableHead className="w-[120px]">Category</TableHead>
          <TableHead className="w-[120px]">Requirement Source</TableHead>
          <TableHead className="w-[350px]">Description</TableHead>
          <TableHead className="w-[100px] text-right">Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requiredTrainings.map((training) => (
          <TableRow key={training.id}>
            <TableCell>
              <div className="font-medium">{training.title}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{training.category}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={training.source === 'County' ? 'destructive' : 'default'} 
                className={training.source === 'AVFRD' ? 
                  'bg-company-yellow text-company-black hover:bg-company-yellow/80' : ''}>
                {training.source}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[350px] break-words">
              {training.description || "No description available"}
            </TableCell>
            <TableCell className="text-right">
              {training.external_url ? (
                <Button 
                  size="sm" 
                  className="bg-company-yellow text-company-black hover:bg-company-yellow/90"
                  onClick={() => window.open(training.external_url, '_blank')}
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Link
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled
                >
                  No Link
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {requiredTrainings.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No additional trainings required
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
