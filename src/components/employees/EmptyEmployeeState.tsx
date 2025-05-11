
import React from "react";

interface EmptyEmployeeStateProps {
  hasEmployees: boolean;
}

export function EmptyEmployeeState({ hasEmployees }: EmptyEmployeeStateProps) {
  if (hasEmployees) {
    return (
      <div className="rounded-md border bg-white p-8 text-center">
        <p className="text-muted-foreground">No valid employee records found</p>
        <p className="text-xs text-muted-foreground mt-2">Data may be missing required fields</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border bg-white p-8 text-center">
      <p className="text-muted-foreground">No employees found</p>
    </div>
  );
}

export default EmptyEmployeeState;
