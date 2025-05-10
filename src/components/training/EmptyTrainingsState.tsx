
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

interface EmptyTrainingsStateProps {
  isAdmin?: boolean;
}

export function EmptyTrainingsState({ isAdmin }: EmptyTrainingsStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-2 py-4">
          <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
          <p className="text-base font-medium">No training records found</p>
          <p className="text-sm max-w-md">
            This could be because the BambooHR integration needs to be configured or 
            your employee ID mapping needs to be updated.
          </p>
          {isAdmin && (
            <Button asChild variant="outline" className="mt-2">
              <Link to="/admin-settings" className="flex items-center gap-2">
                Check BambooHR Integration Settings
              </Link>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
