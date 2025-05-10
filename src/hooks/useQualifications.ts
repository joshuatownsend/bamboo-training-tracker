
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { positions, trainings, trainingCompletions } from "@/lib/data";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { QualificationStatus } from "@/lib/types";

export function useQualifications() {
  const { currentUser, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState("county");
  
  // Get qualification status for all positions if user is logged in
  const qualifications = currentUser
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainings,
        trainingCompletions
      )
    : [];
    
  return {
    qualifications,
    activeTab,
    setActiveTab,
    isLoading
  };
}
