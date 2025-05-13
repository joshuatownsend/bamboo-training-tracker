
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BugPlay, Database, Terminal, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DiagnosticTools: React.FC = () => {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      // First, call our database diagnostic function
      const { data: dbDiagnostic, error: dbError } = await supabase.rpc('diagnostic_training_completions');
      
      if (dbError) {
        throw new Error(`Database diagnostic failed: ${dbError.message}`);
      }
      
      // Try to call the edge function diagnostic
      let edgeFunctionDiagnostic = null;
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('sync-training-completions/diagnostic');
        if (!edgeError) {
          edgeFunctionDiagnostic = edgeData;
        } else {
          console.warn("Edge function diagnostic error:", edgeError);
        }
      } catch (edgeErr) {
        console.warn("Failed to call edge function diagnostic:", edgeErr);
      }
      
      // Combine the results
      const combinedResults = {
        databaseDiagnostic: dbDiagnostic,
        edgeFunctionDiagnostic,
        timestamp: new Date().toISOString(),
      };
      
      setDiagnosticResult(combinedResults);
      
      toast({
        title: "Diagnostics Complete",
        description: "System diagnostics have been run successfully.",
      });
    } catch (error) {
      console.error("Error running diagnostics:", error);
      
      toast({
        title: "Diagnostic Error",
        description: error instanceof Error ? error.message : "Failed to run diagnostics",
        variant: "destructive",
      });
      
      setDiagnosticResult({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold">Diagnostic Tools</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={runDiagnostic}
          disabled={isRunningDiagnostic}
          className="gap-2"
        >
          {isRunningDiagnostic ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <BugPlay className="h-4 w-4" />
              Run Diagnostics
            </>
          )}
        </Button>
      </div>
      
      {diagnosticResult && (
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Diagnostic Results
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(diagnosticResult.timestamp).toLocaleString()}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-64 w-full rounded-md border">
              <div className="p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(diagnosticResult, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <Alert className="bg-yellow-50 border-yellow-200">
        <BugPlay className="h-4 w-4" />
        <AlertTitle>Advanced Troubleshooting</AlertTitle>
        <AlertDescription>
          These diagnostic tools check the status of the training completions sync system by 
          querying the database, checking access to necessary tables, and validating edge function connectivity.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DiagnosticTools;
