
import React from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TroubleshootingToolsProps {
  showDebugInfo: boolean;
  setShowDebugInfo: React.Dispatch<React.SetStateAction<boolean>>;
  handleRefresh: () => void;
}

export const TroubleshootingTools: React.FC<TroubleshootingToolsProps> = ({
  showDebugInfo,
  setShowDebugInfo,
  handleRefresh
}) => {
  const { toast } = useToast();

  // Check database connection
  const checkDatabaseConnection = async () => {
    try {
      // Use the employee_mappings table instead of cached_employees
      const { data, error, count } = await supabase
        .from('employee_mappings')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        toast({
          title: "Database Connection Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Database Connection Successful",
          description: "Successfully connected to the database.",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }
    } catch (error) {
      toast({
        title: "Database Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="w-full text-xs"
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        {showDebugInfo ? "Hide Troubleshooting Info" : "Show Troubleshooting Info"}
      </Button>
      
      {showDebugInfo && (
        <div className="space-y-2 border rounded p-3 text-xs bg-slate-50">
          <h3 className="font-medium">Troubleshooting Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={checkDatabaseConnection}
            >
              <Database className="h-3 w-3 mr-1" />
              Test DB Connection
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Cache Status
            </Button>
          </div>
          
          <div className="mt-2">
            <h4 className="font-medium text-xs text-gray-700">Supabase Config</h4>
            <p className="text-[10px] text-gray-500 mt-1">
              Make sure BAMBOOHR_API_KEY and BAMBOOHR_SUBDOMAIN are set in your Supabase edge function secrets.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
