
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { EmployeeMapping } from '@/hooks/useEmployeeMapping';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import useBambooHR from '@/hooks/useBambooHR';
import { useToast } from '@/hooks/use-toast';
import { MappingDisplay } from './employee-mapping/MappingDisplay';
import { BulkActions } from './employee-mapping/BulkActions';

const EmployeeMappingManager = () => {
  const [mappings, setMappings] = useState<EmployeeMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const {
    getAllEmployeeMappings,
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
      
      toast({
        title: "Data Loaded",
        description: `Loaded ${mappingsData.length} mappings`,
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

  // Handle deleting a mapping
  const handleDeleteMapping = async (id: string) => {
    const success = await deleteEmployeeMapping(id);
    if (success) {
      loadData(); // Refresh the list
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Employee ID Mappings</CardTitle>
        <CardDescription>
          Map user email addresses to BambooHR employee IDs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          {/* Bulk actions section */}
          <BulkActions onRefresh={loadData} />
          
          {/* Mappings display with search and table */}
          <MappingDisplay 
            mappings={mappings}
            loading={loading || mappingLoading}
            onDelete={handleDeleteMapping}
            onRefresh={loadData}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="text-xs text-muted-foreground">
          Last updated: {loading ? "Loading..." : new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmployeeMappingManager;
