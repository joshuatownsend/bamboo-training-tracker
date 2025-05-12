
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/lib/types";

/**
 * Hook to fetch cached employees from Supabase
 */
export function useEmployeesCache() {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['cached', 'employees'],
    queryFn: async () => {
      console.log("Fetching cached employees from Supabase");
      
      const { data, error } = await supabase
        .from('cached_employees')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching cached employees:", error);
        toast({
          title: "Error fetching employees",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      console.log(`Fetched ${data.length} cached employees`);
      
      // Map Supabase data to our Employee type
      return data.map((emp): Employee => ({
        id: emp.id,
        name: emp.name,
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
        hireDate: emp.hire_date
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
