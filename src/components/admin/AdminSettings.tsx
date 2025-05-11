
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import EmailSettingsManager from "./settings/EmailSettingsManager";
import GroupSettingsManager from "./settings/GroupSettingsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BambooHRSyncStatus } from "./BambooHRSyncStatus";

const AdminSettings: React.FC = () => {
  const {
    settings,
    isLoading,
    saveSettings,
    addEmail,
    removeEmail,
    addGroup,
    removeGroup
  } = useAdminSettings();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="access" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="access">Access Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="access" className="space-y-6">
          <EmailSettingsManager
            adminEmails={settings.adminEmails}
            onAddEmail={addEmail}
            onRemoveEmail={removeEmail}
          />
          
          <GroupSettingsManager
            adminGroups={settings.adminGroups}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
          />
          
          <Button onClick={saveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminSettings;
