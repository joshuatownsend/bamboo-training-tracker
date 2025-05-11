
import React from "react";
import AdminSettings from "@/components/admin/AdminSettings";
import BambooHRConfig from "@/components/admin/BambooHRConfig";
import EmployeeMappingManager from "@/components/admin/EmployeeMappingManager";
import WelcomeMessageManager from "@/components/admin/WelcomeMessageManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
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
          
          <BambooHRConfig />
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
          
          <WelcomeMessageManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
