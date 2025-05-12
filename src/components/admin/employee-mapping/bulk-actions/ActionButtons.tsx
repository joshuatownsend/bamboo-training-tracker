
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import useBambooHR from '@/hooks/useBambooHR';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import { useUser } from "@/contexts/user";

interface ActionButtonsProps {
  onRefresh: () => void;
}

export const ActionButtons = ({ onRefresh }: ActionButtonsProps) => {
  const { toast } = useToast();
  const { refreshEmployeeId } = useUser();
  const { saveBulkEmployeeMappings } = useEmployeeMapping();
  const bambooHR = useBambooHR();

  // Handle auto-mapping by email
  const handleAutoMap = async () => {
    try {
      // Load employees from BambooHR
      const employeesData = await bambooHR.getBambooService().getEmployees();
      
      if (employeesData.length === 0) {
        toast({
          title: "No Employees",
          description: "No employees available from BambooHR for mapping",
          variant: "destructive"
        });
        return;
      }
      
      // Create mappings for employees with matching work emails
      const newMappings = employeesData
        .filter(emp => emp.email) // Only consider employees with emails
        .map(emp => ({
          email: emp.email.toLowerCase(),
          employeeId: emp.id
        }));
      
      if (newMappings.length === 0) {
        toast({
          title: "No Mappings",
          description: "No employees with emails found for auto-mapping",
          variant: "destructive"
        });
        return;
      }
      
      const success = await saveBulkEmployeeMappings(newMappings);
      if (success) {
        onRefresh(); // Refresh the list
        await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
        
        toast({
          title: "Auto-Mapping Complete",
          description: `Created ${newMappings.length} mappings automatically`,
        });
      }
    } catch (error) {
      console.error("Error in auto-mapping:", error);
      toast({
        title: "Auto-Mapping Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleAutoMap}
      className="w-full"
    >
      Map from Local Cache
    </Button>
  );
};
