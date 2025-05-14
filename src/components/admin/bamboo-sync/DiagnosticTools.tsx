
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Server, 
  Terminal 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function DiagnosticTools() {
  const { toast } = useToast();
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('diagnostic_training_completions');
      
      if (error) {
        console.error("Diagnostic error:", error);
        toast({
          title: "Diagnostic Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setDiagnosticData(data);
      
      toast({
        title: "Diagnostics Complete",
        description: "Database diagnostic information successfully retrieved.",
      });
    } catch (e) {
      console.error("Exception in diagnostics:", e);
      toast({
        title: "Diagnostic Exception",
        description: e instanceof Error ? e.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runEdgeDiagnostics = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-training-completions/diagnostic', {
        body: { check: "all" }
      });
      
      if (error) {
        console.error("Edge function diagnostic error:", error);
        toast({
          title: "Edge Function Diagnostic Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setDiagnosticData(prev => ({
        ...prev,
        edge_function: data
      }));
      
      toast({
        title: "Edge Function Diagnostics Complete",
        description: "Edge function diagnostic information successfully retrieved.",
      });
    } catch (e) {
      console.error("Exception in edge diagnostics:", e);
      toast({
        title: "Edge Diagnostic Exception",
        description: e instanceof Error ? e.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkVersion = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-training-completions/version');
      
      if (error) {
        console.error("Version check error:", error);
        toast({
          title: "Version Check Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      setDiagnosticData(prev => ({
        ...prev,
        version_info: data
      }));
      
      toast({
        title: "Version Check Complete",
        description: `Edge function version: ${data?.version || 'unknown'}`,
      });
    } catch (e) {
      console.error("Exception in version check:", e);
      toast({
        title: "Version Check Exception",
        description: e instanceof Error ? e.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-sm font-medium">Diagnostic Tools</CardTitle>
      </CardHeader>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs h-8"
          onClick={runDiagnostics}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Database className="h-3 w-3 mr-1" />}
          Database Diagnostics
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs h-8" 
          onClick={checkVersion}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Terminal className="h-3 w-3 mr-1" />}
          Check Version
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs h-8"
          onClick={runEdgeDiagnostics}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Server className="h-3 w-3 mr-1" />}
          Edge Function Diagnostics
        </Button>
      </div>
      
      {diagnosticData && (
        <Card className="mt-4 bg-slate-50 border-slate-200 text-xs">
          <CardContent className="p-3 space-y-2">
            {/* Version Info */}
            {diagnosticData.version_info && (
              <div>
                <p className="font-semibold">Edge Function Version:</p>
                <p className="text-green-600">{diagnosticData.version_info.version}</p>
              </div>
            )}
            
            {/* Database Counts */}
            {diagnosticData.employee_completions_count !== undefined && (
              <div>
                <p className="font-semibold">Database Records:</p>
                <div className="ml-2">
                  <p>Legacy Training Completions: {diagnosticData.employee_completions_count}</p>
                  <p>New Training Completions: {diagnosticData.employee_completions_2_count}</p>
                  <p>Cached Completions: {diagnosticData.cached_completions_count}</p>
                </div>
              </div>
            )}
            
            {/* Sync Status */}
            {diagnosticData.sync_status && (
              <div>
                <p className="font-semibold">Sync Status:</p>
                <div className="ml-2 space-y-1">
                  <p>Status: <span className={cn(
                    "font-medium",
                    diagnosticData.sync_status.status === 'success' && "text-green-600",
                    diagnosticData.sync_status.status === 'error' && "text-red-600",
                    diagnosticData.sync_status.status === 'running' && "text-amber-600"
                  )}>{diagnosticData.sync_status.status}</span></p>
                  
                  {diagnosticData.sync_status.last_sync && (
                    <p>Last sync: {new Date(diagnosticData.sync_status.last_sync).toLocaleString()}</p>
                  )}
                  
                  {diagnosticData.sync_status.error && (
                    <p className="text-red-600">Error: {diagnosticData.sync_status.error}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Auth Test */}
            {diagnosticData.auth_test && (
              <div>
                <p className="font-semibold">Auth Status:</p>
                <div className="ml-2">
                  <p>Service Role Key Available: {diagnosticData.auth_test.service_role_key_exists ? "Yes" : "No"}</p>
                  <p>Anon Key Available: {diagnosticData.auth_test.anon_key_exists ? "Yes" : "No"}</p>
                </div>
              </div>
            )}
            
            {/* Detailed info toggle */}
            <Button 
              variant="ghost" 
              className="text-xs h-6 px-2 w-full justify-start"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} raw JSON data
            </Button>
            
            {/* Raw diagnostic data */}
            {showDetails && (
              <div className="bg-slate-100 p-2 rounded overflow-auto max-h-40">
                <pre>{JSON.stringify(diagnosticData, null, 2)}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 pt-0 flex justify-between">
            <p className="text-slate-500 text-[10px]">Last run: {new Date().toLocaleString()}</p>
            
            {(!diagnosticData.employee_completions_2_count || diagnosticData.employee_completions_2_count === 0) && (
              <div className="flex items-center text-amber-600 text-[10px]">
                <AlertCircle className="h-3 w-3 mr-1" />
                No records in new table yet
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
