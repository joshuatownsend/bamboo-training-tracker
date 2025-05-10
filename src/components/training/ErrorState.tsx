
import React from 'react';
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorStateProps {
  error: Error | unknown;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="p-8 text-center">
      <p className="text-red-500">Error loading training records</p>
      <p className="text-sm text-muted-foreground mt-2">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Button asChild variant="outline" className="gap-2 mt-4">
        <Link to="/bamboo-diagnostics">
          <Stethoscope className="h-4 w-4" />
          Diagnose API Issues
        </Link>
      </Button>
    </div>
  );
}
