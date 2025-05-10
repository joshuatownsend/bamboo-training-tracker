
import React from 'react';
import { useUser } from "@/contexts/UserContext";

export function QualificationsHeader() {
  const { currentUser } = useUser();
  
  return (
    <div>
      <h1 className="text-3xl font-bold">My Qualifications</h1>
      <p className="text-muted-foreground mt-2">
        View your current qualifications for operational positions based on your completed trainings
        {currentUser?.name && ` - ${currentUser.name}`}
      </p>
    </div>
  );
}
