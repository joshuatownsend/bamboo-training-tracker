
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Database, Wrench, AlertTriangle, RefreshCw, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Define types for the API responses
interface AuthKeysTestResponse {
  service_role_key_exists: boolean;
  anon_key_exists: boolean;
  timestamp?: string;
}

interface VersionCheckResponse {
  success: boolean;
  function?: string;
  version_info?: {
    version: string;
    timestamp?: string;
  };
  error?: string;
}

export function DiagnosticTools() {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const runDiagnostics = async () => {
    setIsRunningDiagnostic(true);
    
    try {
      toast({
        title: "Running diagnostics",
        description: "Checking training completions sync status...",
      });
      
      // Call the diagnostic function
      const { data, error } = await supabase.rpc('diagnostic_training_completions');
      
      if (error) {
        console.error("Error running diagnostics:", error);
        toast({
          title: "Diagnostic error",
          description: `Failed to run diagnostics: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Diagnostic results:", data);
      setDiagnosticResult(data);
      setShowDiagnostics(true);
      
      toast({
        title: "Diagnostics complete",
        description: "Check the results below for more details.",
      });
    } catch (error) {
      console.error("Exception running diagnostics:", error);
      toast({
        title: "Diagnostic exception",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  
  // Helper function to check authentication keys access
  const testAuthKeys = async () => {
    setIsRunningDiagnostic(true);
    
    try {
      toast({
        title: "Testing authentication keys",
        description: "Checking if function can access authentication keys...",
      });
      
      // Call the test function
      const { data, error } = await supabase.rpc('test_auth_keys_access');
      
      if (error) {
        console.error("Error testing auth keys:", error);
        toast({
          title: "Auth test error",
          description: `Failed to test auth keys: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Auth keys test result:", data);
      // Cast the data properly with type checking
      if (data && typeof data === 'object') {
        const authTestResult = data as unknown as AuthKeysTestResponse;
        
        toast({
          title: "Auth keys test complete",
          description: `Service role key: ${authTestResult.service_role_key_exists ? 'Available' : 'Missing'}, Anon key: ${authTestResult.anon_key_exists ? 'Available' : 'Missing'}`,
          variant: authTestResult.service_role_key_exists && authTestResult.anon_key_exists ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Auth test error",
          description: "Unexpected response format from auth keys test",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Exception testing auth keys:", error);
      toast({
        title: "Auth test exception",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  
  // Helper function to check the edge function version
  const checkEdgeFunctionVersion = async () => {
    setIsRunningDiagnostic(true);
    
    try {
      toast({
        title: "Checking edge function version",
        description: "Contacting the sync-training-completions edge function...",
      });
      
      // Call the version function
      const { data, error } = await supabase.rpc('check_edge_function_version', {
        function_name: 'sync-training-completions'
      });
      
      if (error) {
        console.error("Error checking edge function version:", error);
        toast({
          title: "Version check error",
          description: `Failed to check version: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Edge function version check result:", data);
      // Cast data properly with type safety
      if (data && typeof data === 'object' && 'success' in data) {
        const versionResult = data as unknown as VersionCheckResponse;
        
        if (versionResult.success) {
          toast({
            title: "Version check complete",
            description: `Edge function found: ${versionResult.version_info?.version || 'Unknown'}`,
            variant: "default",
          });
        } else {
          toast({
            title: "Version check failed",
            description: versionResult.error || "Unknown error",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Version check error",
          description: "Unexpected response format from version check",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Exception checking edge function version:", error);
      toast({
        title: "Version check exception",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center">
        <Wrench className="h-4 w-4 mr-1" />
        Diagnostic Tools
      </h4>
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunningDiagnostic}
            className="bg-white"
          >
            {isRunningDiagnostic ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Database className="h-3 w-3 mr-1" />
            )}
            Run Diagnostics
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testAuthKeys}
            disabled={isRunningDiagnostic}
            className="bg-white"
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Test Auth Keys
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={checkEdgeFunctionVersion}
            disabled={isRunningDiagnostic}
            className="bg-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check Edge Function
          </Button>
        </div>
        
        {diagnosticResult && showDiagnostics && (
          <Collapsible open={showDiagnostics} onOpenChange={setShowDiagnostics} className="mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between bg-white">
                <span>Diagnostic Results</span>
                <span>{showDiagnostics ? '▲' : '▼'}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2 border border-t-0 border-gray-200 rounded-b-md">
              <DiagnosticResultDisplay result={diagnosticResult} />
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {!diagnosticResult && (
          <Alert className="bg-slate-50 mt-2">
            <AlertDescription className="text-xs">
              Run diagnostics to check sync status, database counts, and connectivity.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

// Helper component to display diagnostic results
function DiagnosticResultDisplay({ result }: { result: any }) {
  if (!result) {
    return <Skeleton className="h-20 w-full" />;
  }
  
  const syncStatus = result.sync_status || {};
  const stats = result.training_completions_stats || {};
  // Safely access auth_test with proper type checking
  const authTest = result.auth_test && typeof result.auth_test === 'object' ? 
    result.auth_test as unknown as AuthKeysTestResponse : 
    { service_role_key_exists: false, anon_key_exists: false };
  
  return (
    <div className="space-y-3 text-xs">
      <div>
        <h5 className="font-medium mb-1">Sync Status</h5>
        <div className="grid grid-cols-2 gap-1">
          <div className="font-medium">Status:</div>
          <div>
            <StatusBadge status={syncStatus.status} />
          </div>
          <div className="font-medium">Last Sync:</div>
          <div>{syncStatus.last_sync ? new Date(syncStatus.last_sync).toLocaleString() : 'Never'}</div>
          <div className="font-medium">Last Updated:</div>
          <div>{syncStatus.updated_at ? new Date(syncStatus.updated_at).toLocaleString() : 'Unknown'}</div>
          {syncStatus.error && (
            <>
              <div className="font-medium text-red-600">Error:</div>
              <div className="text-red-600">{syncStatus.error}</div>
            </>
          )}
        </div>
      </div>
      
      <div>
        <h5 className="font-medium mb-1">Database Counts</h5>
        <div className="grid grid-cols-2 gap-1">
          <div className="font-medium">Employee Completions:</div>
          <div>{result.employee_completions_count}</div>
          <div className="font-medium">Cached Completions:</div>
          <div>{result.cached_completions_count}</div>
          <div className="font-medium">Unique Employees:</div>
          <div>{stats.employees_with_completions || 0}</div>
          <div className="font-medium">Unique Trainings:</div>
          <div>{stats.unique_trainings || 0}</div>
          <div className="font-medium">Earliest Completion:</div>
          <div>{stats.earliest_completion || 'None'}</div>
          <div className="font-medium">Latest Completion:</div>
          <div>{stats.latest_completion || 'None'}</div>
        </div>
      </div>
      
      <div>
        <h5 className="font-medium mb-1">Authentication Keys</h5>
        <div className="grid grid-cols-2 gap-1">
          <div className="font-medium">Service Role Key:</div>
          <div>{authTest.service_role_key_exists ? 'Available ✅' : 'Missing ❌'}</div>
          <div className="font-medium">Anon Key:</div>
          <div>{authTest.anon_key_exists ? 'Available ✅' : 'Missing ❌'}</div>
        </div>
      </div>
      
      <div className="text-gray-500 italic">
        Diagnostic run at: {result.diagnostic_time ? new Date(result.diagnostic_time).toLocaleString() : 'Unknown'}
      </div>
    </div>
  );
}

// Helper component for status badges
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Success</Badge>;
    case 'partial_success':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial Success</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Running</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default DiagnosticTools;
