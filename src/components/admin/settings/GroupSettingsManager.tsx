
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GroupSettingsManagerProps {
  adminGroups: string[];
  onAddGroup: (group: string) => void;
  onRemoveGroup: (group: string) => void;
}

const GroupSettingsManager: React.FC<GroupSettingsManagerProps> = ({
  adminGroups,
  onAddGroup,
  onRemoveGroup,
}) => {
  const [newGroup, setNewGroup] = useState("");

  const handleAddGroup = () => {
    if (!newGroup || adminGroups.includes(newGroup)) {
      toast({
        title: "Invalid group",
        description: "Please enter a valid group name that is not already in the list.",
        variant: "destructive",
      });
      return;
    }
    onAddGroup(newGroup);
    setNewGroup("");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Azure AD Groups</h2>
      <div className="mb-4 flex gap-2">
        <Input 
          placeholder="Enter Azure AD group name/ID"
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleAddGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group Name/ID</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No admin groups configured
              </TableCell>
            </TableRow>
          ) : (
            adminGroups.map((group) => (
              <TableRow key={group}>
                <TableCell>{group}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemoveGroup(group)}
                    aria-label={`Remove ${group}`}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default GroupSettingsManager;
