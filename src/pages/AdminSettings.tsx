
import React, { useEffect } from "react";
import AdminSettings from "@/components/admin/AdminSettings";
import BambooHRConfig from "@/components/admin/BambooHRConfig";
import EmployeeMappingManager from "@/components/admin/EmployeeMappingManager";
import WelcomeMessageManager from "@/components/admin/WelcomeMessageManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { WelcomeMessagesProvider } from "@/contexts/WelcomeMessagesContext";
import { BambooHRSyncStatus } from "@/components/admin/BambooHRSyncStatus";

export default function AdminSettingsPage() {
  // Add useEffect to check for any initialization issues
  useEffect(() => {
    console.log("AdminSettingsPage mounted - initializing components");
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      
      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">Admin Access</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="mappings">Employee Mappings</TabsTrigger>
          <TabsTrigger value="messages">Welcome Messages</TabsTrigger>
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
          
          <div className="flex justify-end mb-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/bamboo-troubleshooting" className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" />
                BambooHR Troubleshooting
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BambooHRConfig />
            <BambooHRSyncStatus />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mt-6">
            <h3 className="text-sm font-medium text-yellow-800">About Data Synchronization</h3>
            <p className="text-sm mt-1 text-yellow-700">
              Employee data from BambooHR is automatically synchronized every 6 hours and cached in the database.
              This improves load times and reduces API calls to BambooHR.
            </p>
            
            <h3 className="text-sm font-medium text-blue-800 mt-4">Manual Sync</h3>
            <p className="text-sm mt-1 text-blue-700">
              Use the "Sync Now" button to manually trigger an immediate data synchronization with BambooHR.
              This is useful after making changes in BambooHR.
            </p>
            
            <h3 className="text-sm font-medium text-gray-800 mt-4">Troubleshooting</h3>
            <p className="text-sm mt-1 text-gray-700">
              If sync fails, check your BambooHR API credentials. 
              For persistent issues, review the error message and edge function logs.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="mappings" className="space-y-4">
          <p className="text-muted-foreground">
            Map user email addresses to BambooHR employee IDs to enable personalized training views.
          </p>
          
          <EmployeeMappingManager />
        </TabsContent>
        <TabsContent value="messages" className="space-y-4">
          <p className="text-muted-foreground">
            Set welcome messages and announcements that will appear at the top of the Dashboard.
          </p>
          
          <WelcomeMessagesProvider>
            <WelcomeMessageManager />
          </WelcomeMessagesProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
}
