
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

interface ConnectionSettingsProps {
  subdomain: string;
  setSubdomain: (subdomain: string) => void;
  updateSubdomain: () => void;
  isConfigured: boolean;
}

const ConnectionSettings = ({ subdomain, setSubdomain, updateSubdomain, isConfigured }: ConnectionSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Settings</CardTitle>
        <CardDescription>
          {getEffectiveBambooConfig().useEdgeFunction 
            ? "Enter your BambooHR subdomain below to help with diagnostics. This is stored locally for reference only."
            : "Adjust your connection settings before running the API tests."}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="subdomain">BambooHR Subdomain</Label>
            <div className="flex mt-1 gap-2">
              <input 
                id="subdomain"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="Your company's BambooHR subdomain"
              />
              <Button onClick={updateSubdomain}>Update</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This is the prefix in your BambooHR URL: https://<strong>[your-company]</strong>.bamboohr.com
            </p>
            {getEffectiveBambooConfig().useEdgeFunction && (
              <p className="text-xs text-amber-600 mt-1">
                Note: When using Edge Function mode, this subdomain is used for diagnostics only. Your actual subdomain is stored securely in Supabase secrets.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionSettings;
