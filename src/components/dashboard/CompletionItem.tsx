
import React from 'react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCompletionDate, getInitials } from "./utils/training-display-utils";
import { TrainingCompletion } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Award } from "lucide-react";

interface CompletionItemProps {
  completion: TrainingCompletion;
  trainingName: string;
}

export function CompletionItem({ completion, trainingName }: CompletionItemProps) {
  const navigate = useNavigate();

  // FIXED: Improve date display and add debugging
  const displayDate = (() => {
    console.log("CompletionItem - Raw completion date:", completion.completionDate, typeof completion.completionDate);
    
    // Format completion date with our helper and fallback to raw string
    const formattedDate = formatCompletionDate(completion.completionDate);
    console.log("CompletionItem - Formatted completion date:", formattedDate);
    return formattedDate;
  })();
  
  // Create the employee display name
  const employeeName = completion.employeeData?.name || "Unknown Employee";
  const initials = getInitials(employeeName);
  
  // Handle click on training record
  const handleClick = () => {
    if (completion.employeeData?.bamboo_employee_id) {
      window.open(`https://avfrd.bamboohr.com/employees/training/?id=${completion.employeeData.bamboo_employee_id}`, "_blank");
    }
  };
  
  return (
    <li className="flex items-center gap-4 py-3">
      <Avatar>
        <AvatarFallback 
          className={cn(
            "bg-gray-100 text-gray-800"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {employeeName}
        </p>
        <div className="flex items-center gap-2">
          <Award className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground truncate">
            {trainingName || "Unknown Training"}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm">
          {/* FIXED: Display the date with better fallback */}
          {displayDate}
        </p>
        <button 
          onClick={handleClick} 
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 ml-auto"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </button>
      </div>
    </li>
  );
}

export default CompletionItem;
