
import { Save } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NewMappingFormProps {
  newEmail: string;
  setNewEmail: (email: string) => void;
  newEmployeeId: string;
  setNewEmployeeId: (id: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const NewMappingForm = ({
  newEmail,
  setNewEmail,
  newEmployeeId,
  setNewEmployeeId,
  onSave,
  isLoading
}: NewMappingFormProps) => {
  return (
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
        onClick={onSave}
        disabled={!newEmail || !newEmployeeId || isLoading}
      >
        <Save className="mr-2 h-4 w-4" />
        Save Mapping
      </Button>
    </div>
  );
};
