
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

// This would be stored in localStorage for now
// In a real implementation, this would be stored in a database
const LOCAL_STORAGE_KEY = "avfrd_admin_settings";

interface AdminSettings {
  adminEmails: string[];
  adminGroups: string[];
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>({
    adminEmails: [],
    adminGroups: []
  });
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
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your changes.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = (email: string) => {
    if (!email || settings.adminEmails.includes(email.toLowerCase())) {
      return false;
    }
    setSettings({
      ...settings,
      adminEmails: [...settings.adminEmails, email.toLowerCase()]
    });
    return true;
  };

  const removeEmail = (email: string) => {
    setSettings({
      ...settings,
      adminEmails: settings.adminEmails.filter(e => e !== email)
    });
  };

  const addGroup = (group: string) => {
    if (!group || settings.adminGroups.includes(group)) {
      return false;
    }
    setSettings({
      ...settings,
      adminGroups: [...settings.adminGroups, group]
    });
    return true;
  };

  const removeGroup = (group: string) => {
    setSettings({
      ...settings,
      adminGroups: settings.adminGroups.filter(g => g !== group)
    });
  };

  return {
    settings,
    isLoading,
    saveSettings,
    addEmail,
    removeEmail,
    addGroup,
    removeGroup
  };
}
