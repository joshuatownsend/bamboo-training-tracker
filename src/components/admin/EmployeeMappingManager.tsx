
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeMapping } from '@/hooks/useEmployeeMapping';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import useBambooHR from '@/hooks/useBambooHR';
import { Search, Plus, Trash2, RefreshCw, Save, Database, CloudSync } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from "@/contexts/UserContext";
import { supabase } from '@/integrations/supabase/client';

const EmployeeMappingManager = () => {
  const [mappings, setMappings] = useState<EmployeeMapping[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [syncingEmployees, setSyncingEmployees] = useState(false);
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
          variant: "warning"
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
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search mappings..."
                className="w-full pl-8 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading || mappingLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoMap}
                disabled={loading || mappingLoading}
              >
                <Database className="mr-2 h-4 w-4" />
                Map from Local Cache
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSyncFromBambooHR}
                disabled={syncingEmployees}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <CloudSync className={`mr-2 h-4 w-4 ${syncingEmployees ? 'animate-spin' : ''}`} />
                Sync from BambooHR
              </Button>
            </div>
          </div>

          {/* Add new mapping form */}
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Email Address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="BambooHR Employee ID"
              value={newEmployeeId}
              onChange={(e) => setNewEmployeeId(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSaveMapping}
              disabled={!newEmail || !newEmployeeId || mappingLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Mapping
            </Button>
          </div>

          {/* Mappings table */}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {filteredMappings.length === 0 ? (
                <Alert>
                  <AlertTitle>No mappings found</AlertTitle>
                  <AlertDescription>
                    {searchQuery ? 
                      "No mappings match your search query. Try a different search or add a new mapping." :
                      "There are no email to employee ID mappings yet. Add your first mapping above or use the Sync from BambooHR button."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-medium">{mapping.email}</TableCell>
                          <TableCell>{mapping.bamboo_employee_id}</TableCell>
                          <TableCell>{mapping.updated_at ? new Date(mapping.updated_at).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMapping(mapping.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
