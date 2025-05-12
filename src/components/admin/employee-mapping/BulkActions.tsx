
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import useBambooHR from '@/hooks/useBambooHR';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import { useUser } from "@/contexts/user";
import { useBambooSync } from '@/hooks/cache/useBambooSync';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkActionsProps {
  onRefresh: () => void;
}

export const BulkActions = ({ onRefresh }: BulkActionsProps) => {
  const [syncingEmployees, setSyncingEmployees] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const { refreshEmployeeId } = useUser();
  const { saveBulkEmployeeMappings } = useEmployeeMapping();
  const bambooHR = useBambooHR();
  const { triggerSync } = useBambooSync();

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
      // Get the result directly as a boolean value
      const result = await triggerSync();
      
      // Just check if result is true (success) without trying to call it
      if (result) {
        toast({
          title: "Manual Sync Initiated",
          description: "The sync job has been manually triggered. Check status in the Sync Status panel.",
        });
        
        // Reload the data after a short delay to allow the sync to complete
        setTimeout(() => {
          onRefresh();
          refreshEmployeeId(); // Refresh the current user's employee ID if relevant
        }, 3000);
      }
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

  // Test BambooHR connection
  const testBambooHRConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      // Check if the BambooHR service is properly instantiated
      const isConfigured = bambooHR.isConfigured();
      
      if (!isConfigured) {
        setConnectionStatus({
          success: false,
          message: "BambooHR is not properly configured. Check API credentials in Supabase."
        });
        return;
      }
      
      // Test the actual connection
      const connected = await bambooHR.getBambooService().testConnection();
      
      if (connected) {
        setConnectionStatus({
          success: true,
          message: "Successfully connected to BambooHR API"
        });
        
        // Try to fetch a small sample of data
        try {
          const testData = await bambooHR.getBambooService().fetchAllData(true);
          if (testData) {
            setConnectionStatus({
              success: true,
              message: `Connected to BambooHR API and retrieved sample data: ${testData.employees.length} employees, ${testData.trainings.length} trainings`
            });
          }
        } catch (fetchError) {
          console.error("Error fetching test data:", fetchError);
          // Still consider it a success if we connected but couldn't fetch data
        }
      } else {
        setConnectionStatus({
          success: false,
          message: "Failed to connect to BambooHR API. Check credentials and API access."
        });
      }
    } catch (error) {
      console.error("Error testing BambooHR connection:", error);
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error while testing connection"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Bulk Actions</h3>
      
      {connectionStatus && (
        <Alert variant={connectionStatus.success ? "default" : "destructive"} className={connectionStatus.success ? "bg-green-50 border-green-200" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{connectionStatus.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
          <AlertDescription>
            {connectionStatus.message}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={testBambooHRConnection}
          disabled={testingConnection}
          className="w-full"
        >
          {testingConnection ? "Testing..." : "Test BambooHR Connection"}
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleAutoMap}
          className="w-full"
        >
          Map from Local Cache
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          variant="default"
          onClick={handleSyncFromBambooHR}
          disabled={syncingEmployees}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {syncingEmployees ? "Syncing..." : "Sync from BambooHR"}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleManualSync}
          disabled={manualSyncLoading}
          className="w-full"
        >
          {manualSyncLoading ? "Running..." : "Run Full Sync Job Now"}
        </Button>
      </div>
    </div>
  );
};
