
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
          <TabsTrigger value="sync">Data Synchronization</TabsTrigger>
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
        
        <TabsContent value="sync" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BambooHRSyncStatus />
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800">About Data Synchronization</h3>
                <p className="text-sm mt-1 text-yellow-700">
                  Employee data from BambooHR is automatically synchronized every 6 hours and cached in the database.
                  This improves load times and reduces API calls to BambooHR.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-800">Manual Sync</h3>
                <p className="text-sm mt-1 text-blue-700">
                  Use the "Sync Now" button to manually trigger an immediate data synchronization with BambooHR.
                  This is useful after making changes in BambooHR.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-800">Troubleshooting</h3>
                <p className="text-sm mt-1 text-gray-700">
                  If sync fails, check your BambooHR API credentials in the Integrations tab. 
                  For persistent issues, review the error message and edge function logs.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminSettings;
