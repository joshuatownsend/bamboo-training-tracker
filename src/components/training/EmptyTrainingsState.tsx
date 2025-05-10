
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";

export function EmptyTrainingsState() {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
        No training records found. Try refreshing the data.
      </TableCell>
    </TableRow>
  );
}
