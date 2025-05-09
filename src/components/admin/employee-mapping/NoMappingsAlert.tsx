
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface NoMappingsAlertProps {
  searchQuery: string;
}

export const NoMappingsAlert = ({ searchQuery }: NoMappingsAlertProps) => {
  return (
    <Alert>
      <AlertTitle>No mappings found</AlertTitle>
      <AlertDescription>
        {searchQuery ? 
          "No mappings match your search query. Try a different search or add a new mapping." :
          "There are no email to employee ID mappings yet. Add your first mapping above or use the Sync from BambooHR button."}
      </AlertDescription>
    </Alert>
  );
};
