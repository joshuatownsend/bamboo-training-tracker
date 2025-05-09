
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import useBambooHR from '@/hooks/useBambooHR';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import { useUser } from "@/contexts/UserContext";

interface BulkActionsProps {
  onRefresh: () => void;
}

export const BulkActions = ({ onRefresh }: BulkActionsProps) => {
  const [syncingEmployees, setSyncingEmployees] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
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

  // Handle syncing employee data from BambooHR via edge function
  const handleSyncFromBambooHR = async () => {
    setSyncingEmployees(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-employee-mappings');
      
      if (error) {
        console.error("Error syncing employee mappings:", error);
        toast({
          title: "Sync Failed",
          description: error.message || "Failed to sync employee mappings from BambooHR",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Sync response:", data);
      
      if (data.success) {
        toast({
          title: "Sync Successful",
          description: `Synced ${data.count} employee mappings from BambooHR`,
        });
        
        // Reload the data to show updated mappings
        onRefresh();
        await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
      } else {
        toast({
          title: "Sync Issue",
          description: data.message || "Unknown issue during sync",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Exception during sync:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSyncingEmployees(false);
    }
  };

  // Handle manual execution of the cron job function
  const handleManualSync = async () => {
    setManualSyncLoading(true);
    
    try {
      // Call the database function that the cron job would call
      const { data, error } = await supabase.rpc('sync_employee_mappings_job');
      
      if (error) {
        console.error("Error manually running sync job:", error);
        toast({
          title: "Manual Sync Failed",
          description: error.message || "Failed to manually run sync job",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Manual sync response:", data);
      
      toast({
        title: "Manual Sync Initiated",
        description: "The sync job has been manually triggered. Check logs for results.",
      });
      
      // Reload the data after a short delay to allow the sync to complete
      setTimeout(() => {
        onRefresh();
        refreshEmployeeId(); // Refresh the current user's employee ID if relevant
      }, 3000);
      
    } catch (error) {
      console.error("Exception during manual sync:", error);
      toast({
        title: "Manual Sync Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setManualSyncLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Bulk Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={handleAutoMap}
          className="w-full sm:w-auto"
        >
          Map from Local Cache
        </Button>
        <Button
          variant="default"
          onClick={handleSyncFromBambooHR}
          disabled={syncingEmployees}
          className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {syncingEmployees ? "Syncing..." : "Sync from BambooHR"}
        </Button>
        <Button
          variant="outline"
          onClick={handleManualSync}
          disabled={manualSyncLoading}
          className="w-full sm:w-auto"
        >
          {manualSyncLoading ? "Running..." : "Run Sync Job Now"}
        </Button>
      </div>
    </div>
  );
};
