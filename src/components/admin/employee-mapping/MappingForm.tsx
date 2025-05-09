
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useEmployeeMapping from '@/hooks/useEmployeeMapping';
import { useUser } from "@/contexts/UserContext";

interface MappingFormProps {
  onSuccess: () => void;
}

export const MappingForm = ({ onSuccess }: MappingFormProps) => {
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { saveEmployeeMapping } = useEmployeeMapping();
  const { refreshEmployeeId } = useUser();

  const handleSaveMapping = async () => {
    if (!email || !employeeId) {
      toast({
        title: "Validation Error",
        description: "Both email and employee ID are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await saveEmployeeMapping(email, employeeId);
      if (success) {
        setEmail('');
        setEmployeeId('');
        onSuccess(); // Refresh the list
        await refreshEmployeeId(); // Refresh the current user's employee ID if relevant
        
        toast({
          title: "Mapping Saved",
          description: `Successfully mapped ${email} to employee ID ${employeeId}`,
        });
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Add New Mapping</h3>
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="BambooHR Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleSaveMapping}
          disabled={!email || !employeeId || isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Mapping"}
        </Button>
      </div>
    </div>
  );
};
