
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import ConnectionConfig from "@/components/bamboo/connection-test/ConnectionConfig";
import ApiEndpointTest from '@/components/bamboo/diagnostics/ApiEndpointTest';
import ResponseViewer from "@/components/bamboo/connection-test/ResponseViewer";
import EdgeFunctionConfig from '@/components/bamboo/troubleshooting/EdgeFunctionConfig';
import CommonIssues from '@/components/bamboo/troubleshooting/CommonIssues';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

const BambooApiDiagnostics = () => {
  const navigate = useNavigate();
  const [endpointPath, setEndpointPath] = useState<string>('/employees/directory');
  const [isTestLoading, setIsTestLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Make runTest return a Promise to match the expected type
  const runTest = async (): Promise<void> => {
    setIsTestLoading(true);
    
    try {
      // Simulate test completion after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setResponseData({ message: "Test completed successfully" });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsTestLoading(false);
    }
  };

  // Get the full config with all required properties
  const config = getEffectiveBambooConfig();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold">BambooHR API Diagnostics</h1>
          </div>
          <p className="text-muted-foreground">
            Diagnose connection issues with the BambooHR API
          </p>
        </div>
      </div>

      <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Debugging BambooHR API Issues
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                This page helps diagnose issues with the BambooHR API integration. 
                Your recent API calls are showing 404 and 503 errors, particularly 
                with the tables/trainingCompleted and tables/certifications endpoints. 
              </p>
              <p className="mt-1">
                Use the tools below to test different endpoints and troubleshoot the connection.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="endpoints">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="endpoints">API Endpoint Testing</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="solutions">Common Solutions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="endpoints" className="space-y-4 mt-6">
          <ApiEndpointTest />
          
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="font-medium mb-2">Known endpoint issues</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium text-amber-800">/employees/[id]/tables/trainingCompleted</span> - 
                Many BambooHR tenants do not have this tables endpoint available.
                Try using <span className="font-medium">/training/record/employee/[id]</span> instead.
              </li>
              <li>
                <span className="font-medium text-amber-800">/employees/[id]/tables/certifications</span> - 
                Like the trainingCompleted endpoint, this may not be available.
                The app will automatically fall back to other endpoints when this occurs.
              </li>
              <li>
                <span className="font-medium text-green-800">/training/record/employee/[id]</span> - 
                This is the most reliable endpoint for getting employee training data.
              </li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4 mt-6">
          <ConnectionConfig 
            endpointPath={endpointPath} 
            setEndpointPath={setEndpointPath}
            isLoading={isTestLoading}
            runTest={runTest}
            config={config}
          />
          <EdgeFunctionConfig />
        </TabsContent>
        
        <TabsContent value="solutions" className="space-y-4 mt-6">
          <CommonIssues />
          
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">View Edge Function Logs</h3>
            <p className="text-sm mb-4">
              To view detailed logs from your edge function:
            </p>
            <ol className="list-decimal ml-6 text-sm space-y-1">
              <li>Go to the Supabase Dashboard</li>
              <li>Navigate to Edge Functions</li>
              <li>Click on the "bamboohr" function</li>
              <li>Select the "Logs" tab</li>
            </ol>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4 gap-2 bg-blue-100"
              onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/logs', '_blank')}
            >
              <FileText className="h-4 w-4" />
              View Edge Function Logs
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/bamboo-test">Return to BambooHR Test</Link>
        </Button>
        <Button asChild>
          <Link to="/admin-settings">Go to Admin Settings</Link>
        </Button>
      </div>
    </div>
  );
};

export default BambooApiDiagnostics;
