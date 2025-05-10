
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ExternalLink } from 'lucide-react';

const EdgeFunctionConfig = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Edge Function Configuration</CardTitle>
        <CardDescription>
          BambooHR API access is now managed by a Supabase Edge Function
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Edge Function Integration</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  BambooHR API access is managed by a Supabase Edge Function. This eliminates CORS issues and 
                  provides better security by keeping your BambooHR credentials on the server.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-md p-3">
          <h4 className="font-medium mb-1">How the Edge Function works:</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Your browser sends an API request to the Supabase Edge Function</li>
            <li>The Edge Function retrieves the BambooHR credentials from environment variables</li>
            <li>The Edge Function forwards your request to BambooHR with the proper authentication</li>
            <li>The Edge Function returns the BambooHR API response to your application</li>
          </ol>
        </div>
        
        <div className="p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-2">Setting Up Supabase Edge Function</h3>
          <p className="text-sm mb-4">
            To use the BambooHR Edge Function, you need to configure the following environment variables in your Supabase project:
          </p>
          <ul className="list-disc ml-6 text-sm space-y-1">
            <li><strong>BAMBOOHR_SUBDOMAIN</strong> - Your BambooHR company subdomain</li>
            <li><strong>BAMBOOHR_API_KEY</strong> - Your BambooHR API key</li>
          </ul>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4 bg-blue-100"
            onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/secrets', '_blank')}
          >
            Open Supabase Secrets Manager
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EdgeFunctionConfig;
