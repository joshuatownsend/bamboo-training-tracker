
import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/user';

interface SyncActionsProps {
  onRefresh: () => void;
}

export const SyncActions = ({ onRefresh }: SyncActionsProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useUser();

  const handleEnhancedSync = async () => {
    try {
      setIsSyncing(true);
      
      // Get the auth session for the bearer token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("No authenticated session found");
        toast({
          title: "Authentication required",
          description: "You must be logged in to trigger a sync",
          variant: "destructive"
        });
        return false;
      }

      console.log("Authenticated user found, triggering sync with token");
      
      // Call the enhanced sync edge function
      const response = await fetch('https://fvpbkkmnzlxbcxokxkce.supabase.co/functions/v1/sync-employee-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
      }

      const result = await response.json();
      
      // Store the last sync time
      setLastSyncTime(new Date().toISOString());
      
      toast({
        title: "Employee sync successful",
        description: `Synced ${result.count || 0} employees from BambooHR`,
      });
      
      // Refresh the mappings list
      onRefresh();
      return true;
    } catch (error) {
      console.error('Error syncing employees:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Enhanced Employee Sync</h4>
            <p className="text-xs text-muted-foreground">
              Sync all employee information from BambooHR (names, departments, divisions, etc)
            </p>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isSyncing || !currentUser}
              onClick={handleEnhancedSync}
            >
              <UserCheck className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync All Employee Info'}
            </Button>
            {!currentUser && (
              <p className="text-xs text-red-600">
                You need to be logged in to perform a sync
              </p>
            )}
            {lastSyncTime && (
              <p className="text-xs text-muted-foreground">
                Last sync: {new Date(lastSyncTime).toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Refresh Local Data</h4>
            <p className="text-xs text-muted-foreground">
              Refresh the data in this page without triggering a new sync
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncActions;
