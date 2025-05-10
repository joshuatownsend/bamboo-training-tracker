
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface MissingEmployeeIdAlertProps {
  isAdmin: boolean;
}

export function MissingEmployeeIdAlert({ isAdmin }: MissingEmployeeIdAlertProps) {
  return (
    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Employee ID Not Found</AlertTitle>
      <AlertDescription>
        Your email address is not mapped to a BambooHR employee ID. 
        {isAdmin ? (
          <span> Please set up the mapping in the <Link to="/admin-settings" className="font-medium underline">Admin Settings</Link> under Employee Mappings.</span>
        ) : (
          <span> Please contact an administrator to set up this mapping for you.</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
