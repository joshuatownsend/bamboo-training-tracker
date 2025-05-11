
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import EmailSettingsManager from "./settings/EmailSettingsManager";
import GroupSettingsManager from "./settings/GroupSettingsManager";

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
    </div>
  );
};

export default AdminSettings;
