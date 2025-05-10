
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ApiErrorAlertProps {
  error: Error | unknown;
}

export function ApiErrorAlert({ error }: ApiErrorAlertProps) {
  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Training Data</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error instanceof Error ? error.message : String(error)}</p>
        <div className="flex gap-2 mt-2">
          <Button asChild size="sm" variant="outline" className="bg-red-100">
            <Link to="/bamboo-diagnostics" className="text-red-800">
              <Stethoscope className="h-4 w-4 mr-1" />
              Diagnose API Issues
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
