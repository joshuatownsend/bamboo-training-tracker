
import { Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmployeeMapping } from '@/hooks/useEmployeeMapping';

interface MappingsTableProps {
  mappings: EmployeeMapping[];
  onDelete: (id: string) => void;
}

export const MappingsTable = ({ mappings, onDelete }: MappingsTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping) => (
            <TableRow key={mapping.id}>
              <TableCell className="font-medium">{mapping.email}</TableCell>
              <TableCell>{mapping.bamboo_employee_id}</TableCell>
              <TableCell>{mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(mapping.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
