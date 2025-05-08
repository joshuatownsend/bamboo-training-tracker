
import React, { useState, useEffect } from "react";
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
import { X, Plus, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// This would be stored in localStorage for now
// In a real implementation, this would be stored in a database
const LOCAL_STORAGE_KEY = "avfrd_admin_settings";

interface AdminSettings {
  adminEmails: string[];
  adminGroups: string[];
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    adminEmails: [],
    adminGroups: []
  });
  const [newEmail, setNewEmail] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to parse admin settings:", error);
        // If parsing fails, initialize with default settings
        const defaultSettings = {
          adminEmails: ['admin@avfrd.org', 'training@avfrd.org'],
          adminGroups: ['training-portal-admins']
        };
        setSettings(defaultSettings);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSettings));
      }
    } else {
      // Initialize with default settings if none exist
      const defaultSettings = {
        adminEmails: ['admin@avfrd.org', 'training@avfrd.org'],
        adminGroups: ['training-portal-admins']
      };
      setSettings(defaultSettings);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSettings));
    }
  }, []);

  const saveSettings = () => {
    setIsLoading(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      toast({
        title: "Settings saved",
        description: "Admin access settings have been updated successfully.",
      });
      // In a real implementation, you would save to a database here
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    if (!newEmail || settings.adminEmails.includes(newEmail.toLowerCase())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email that is not already in the list.",
        variant: "destructive",
      });
      return;
    }
    setSettings({
      ...settings,
      adminEmails: [...settings.adminEmails, newEmail.toLowerCase()]
    });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setSettings({
      ...settings,
      adminEmails: settings.adminEmails.filter(e => e !== email)
    });
  };

  const addGroup = () => {
    if (!newGroup || settings.adminGroups.includes(newGroup)) {
      toast({
        title: "Invalid group",
        description: "Please enter a valid group name that is not already in the list.",
        variant: "destructive",
      });
      return;
    }
    setSettings({
      ...settings,
      adminGroups: [...settings.adminGroups, newGroup]
    });
    setNewGroup("");
  };

  const removeGroup = (group: string) => {
    setSettings({
      ...settings,
      adminGroups: settings.adminGroups.filter(g => g !== group)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Admin Email Addresses</h2>
        <div className="mb-4 flex gap-2">
          <Input 
            placeholder="Enter email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={addEmail}>
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
            {settings.adminEmails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No admin emails configured
                </TableCell>
              </TableRow>
            ) : (
              settings.adminEmails.map((email) => (
                <TableRow key={email}>
                  <TableCell>{email}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeEmail(email)}
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

      <div>
        <h2 className="text-xl font-semibold mb-4">Admin Azure AD Groups</h2>
        <div className="mb-4 flex gap-2">
          <Input 
            placeholder="Enter Azure AD group name/ID"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={addGroup}>
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
            {settings.adminGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No admin groups configured
                </TableCell>
              </TableRow>
            ) : (
              settings.adminGroups.map((group) => (
                <TableRow key={group}>
                  <TableCell>{group}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeGroup(group)}
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

      <Button onClick={saveSettings} disabled={isLoading}>
        <Save className="h-4 w-4 mr-2" />
        Save Settings
      </Button>
    </div>
  );
};

export default AdminSettings;
