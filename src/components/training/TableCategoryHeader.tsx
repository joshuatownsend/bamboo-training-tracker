
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";

interface TableCategoryHeaderProps {
  category: string;
}

export function TableCategoryHeader({ category }: TableCategoryHeaderProps) {
  return (
    <TableRow className="bg-muted/20 hover:bg-muted/20">
      <TableCell colSpan={5} className="font-medium py-2">
        {category}
      </TableCell>
    </TableRow>
  );
}
