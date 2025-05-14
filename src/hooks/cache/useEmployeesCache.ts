
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";

/**
 * Hook to fetch employees from the employee_mappings table
 */
export function useEmployeesCache() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['cached', 'employees'],
    queryFn: async () => {
      console.log("Fetching employees from employee_mappings table");
      
      const { data, error } = await supabase
        .from('employee_mappings')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching employee mappings:", error);
        toast({
          title: "Error fetching employees",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`Fetched ${data.length} employees from mappings table`);
      
      // Map Supabase data to our Employee type
      return data.map((emp): Employee => ({
        id: emp.bamboo_employee_id,
        name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Unknown',
        displayName: emp.display_name,
        firstName: emp.first_name,
        lastName: emp.last_name,
        position: emp.position,
        jobTitle: emp.job_title,
        department: emp.department,
        division: emp.division,
        email: emp.email,
        workEmail: emp.work_email,
        avatar: emp.avatar,
        hireDate: emp.hire_date,
        lastSync: emp.last_sync
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
