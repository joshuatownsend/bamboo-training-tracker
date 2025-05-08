
import React from "react";
import AdminSettings from "@/components/admin/AdminSettings";
import BambooHRConfig from "@/components/admin/BambooHRConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      
      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">Admin Access</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="access" className="space-y-4">
          <p className="text-muted-foreground">
            Manage which email addresses and Azure AD groups have administrator access to the training portal.
          </p>
          <AdminSettings />
        </TabsContent>
        <TabsContent value="integrations" className="space-y-4">
          <p className="text-muted-foreground">
            Configure integrations with external systems like BambooHR to import data.
          </p>
          <BambooHRConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
