
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrainingCompletion } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { formatCompletionDate, getInitials } from "./utils/training-display-utils";

interface CompletionItemProps {
  completion: TrainingCompletion;
  trainingName: string;
}

export const CompletionItem = ({ completion, trainingName }: CompletionItemProps) => {
  const employeeName = completion.employeeData?.name || "Unknown Employee";
  const initials = getInitials(employeeName);
  
  // Create unique key from all available data
  const uniqueKey = `${completion.id || completion.employeeId}-${completion.trainingId}-${completion.completionDate}`;
  
  // Log the completion date being used for debugging
  console.log("CompletionItem rendering with date:", {
    completionDate: completion.completionDate,
    uniqueKey,
    hasDate: !!completion.completionDate
  });
  
  // Get formatted date with improved handling
  const formattedDate = formatCompletionDate(completion.completionDate);
  
  return (
    <div className="flex items-center">
      <Avatar className="h-9 w-9 mr-3">
        <AvatarFallback>{initials || "??"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{employeeName}</p>
        <p className="text-xs text-muted-foreground">{trainingName}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {formattedDate}
        </span>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </div>
    </div>
  );
};

export default CompletionItem;
