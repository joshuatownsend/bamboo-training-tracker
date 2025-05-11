
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
  error: unknown;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to fetch training data: {error instanceof Error ? error.message : "Unknown error"}
      </AlertDescription>
    </Alert>
  );
}
