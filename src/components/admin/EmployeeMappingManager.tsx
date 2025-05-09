
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { EmployeeMapping } from '@/hooks/useEmployeeMapping';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import useBambooHR from '@/hooks/useBambooHR';
import { useToast } from '@/hooks/use-toast';
import { useUser } from "@/contexts/UserContext";
import { supabase } from '@/integrations/supabase/client';
import { SearchBar } from './employee-mapping/SearchBar';
import { ActionButtons } from './employee-mapping/ActionButtons';
import { NewMappingForm } from './employee-mapping/NewMappingForm';
import { MappingsTable } from './employee-mapping/MappingsTable';
import { NoMappingsAlert } from './employee-mapping/NoMappingsAlert';
import { LoadingState } from './employee-mapping/LoadingState';

const EmployeeMappingManager = () => {
  const [mappings, setMappings] = useState<EmployeeMapping[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [syncingEmployees, setSyncingEmployees] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const { toast } = useToast();
  const { refreshEmployeeId } = useUser();
  
  const {
    getAllEmployeeMappings,
    saveEmployeeMapping,
    saveBulkEmployeeMappings,
    deleteEmployeeMapping,
    isLoading: mappingLoading
  } = useEmployeeMapping();
  
  const bambooHR = useBambooHR();

  // Load mappings on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Function to load all data
  const loadData = async () => {
    setLoading(true);
    try {
      // Load mappings from database
      const mappingsData = await getAllEmployeeMappings();
      setMappings(mappingsData);
      
      // Load employees from BambooHR
      const employeesData = await bambooHR.getBambooService().getEmployees();
      setEmployees(employeesData);
      
      toast({
        title: "Data Loaded",
        description: `Loaded ${mappingsData.length} mappings and ${employeesData.length} employees`,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle saving a new mapping
  const handleSaveMapping = async () => {
    if (!newEmail || !newEmployeeId) {
      toast({
        title: "Validation Error",
        description: "Both email and employee ID are required",
        variant: "destructive"
      });
      return;
    }
    
    const success = await saveEmployeeMapping(newEmail, newEmployeeId);
    if (success) {
      setNewEmail('');
      setNewEmployeeId('');
      loadData(); // Refresh the list
      await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
    }
  };

  // Handle auto-mapping by email
  const handleAutoMap = async () => {
    if (employees.length === 0) {
      toast({
        title: "No Employees",
        description: "No employees available from BambooHR for mapping",
        variant: "destructive"
      });
      return;
    }
    
    // Create mappings for employees with matching work emails
    const newMappings = employees
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
      loadData(); // Refresh the list
      await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
      
      toast({
        title: "Auto-Mapping Complete",
        description: `Created ${newMappings.length} mappings automatically`,
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
        loadData();
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
        loadData();
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

  // Handle deleting a mapping
  const handleDeleteMapping = async (id: string) => {
    const success = await deleteEmployeeMapping(id);
    if (success) {
      loadData(); // Refresh the list
    }
  };

  // Filter mappings based on search query
  const filteredMappings = mappings.filter(mapping => 
    mapping.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mapping.bamboo_employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Employee ID Mappings</CardTitle>
        <CardDescription>
          Map user email addresses to BambooHR employee IDs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Search and reload controls */}
          <div className="flex justify-between flex-wrap gap-2">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <ActionButtons 
              loading={loading} 
              mappingLoading={mappingLoading}
              syncingEmployees={syncingEmployees}
              onRefresh={loadData}
              onAutoMap={handleAutoMap}
              onSyncFromBambooHR={handleSyncFromBambooHR}
              onManualSync={handleManualSync}
              manualSyncLoading={manualSyncLoading}
            />
          </div>

          {/* Add new mapping form */}
          <NewMappingForm 
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            newEmployeeId={newEmployeeId}
            setNewEmployeeId={setNewEmployeeId}
            onSave={handleSaveMapping}
            isLoading={mappingLoading}
          />

          {/* Mappings table */}
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {filteredMappings.length === 0 ? (
                <NoMappingsAlert searchQuery={searchQuery} />
              ) : (
                <MappingsTable 
                  mappings={filteredMappings}
                  onDelete={handleDeleteMapping}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          {filteredMappings.length} mapping{filteredMappings.length !== 1 ? 's' : ''} found
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {loading ? "Loading..." : new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmployeeMappingManager;
