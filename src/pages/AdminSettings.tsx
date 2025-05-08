
import React from "react";
import AdminSettings from "@/components/admin/AdminSettings";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
      <p className="text-muted-foreground">
        Manage which email addresses and Azure AD groups have administrator access to the training portal.
      </p>
      
      <AdminSettings />
    </div>
  );
}
