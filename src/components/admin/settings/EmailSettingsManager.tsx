
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

interface EmailSettingsManagerProps {
  adminEmails: string[];
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
}

const EmailSettingsManager: React.FC<EmailSettingsManagerProps> = ({
  adminEmails,
  onAddEmail,
  onRemoveEmail,
}) => {
  const [newEmail, setNewEmail] = useState("");

  const handleAddEmail = () => {
    if (!newEmail || adminEmails.includes(newEmail.toLowerCase())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email that is not already in the list.",
        variant: "destructive",
      });
      return;
    }
    onAddEmail(newEmail.toLowerCase());
    setNewEmail("");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Admin Email Addresses</h2>
      <div className="mb-4 flex gap-2">
        <Input 
          placeholder="Enter email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleAddEmail}>
          <Plus className="h-4 w-4 mr-2" />
          Add Email
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email Address</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adminEmails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No admin emails configured
              </TableCell>
            </TableRow>
          ) : (
            adminEmails.map((email) => (
              <TableRow key={email}>
                <TableCell>{email}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onRemoveEmail(email)}
                    aria-label={`Remove ${email}`}
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

export default EmailSettingsManager;
