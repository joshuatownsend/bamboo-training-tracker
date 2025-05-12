
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
  const { currentUser, isAdmin } = useUser();

  const handleEnhancedSync = async () => {
    try {
      setIsSyncing(true);
      
      if (!currentUser || !isAdmin) {
        toast({
          title: "Permission denied",
          description: "You must be an administrator to trigger a sync",
          variant: "destructive"
        });
        return false;
      }

      console.log("Admin user authenticated, triggering sync");
      
      // Call the enhanced sync edge function with admin header
      const response = await supabase.functions.invoke('sync-employee-mappings', {
        method: 'POST',
        body: {
          adminRequest: true,
          adminEmail: currentUser.email,
          adminName: currentUser.name
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Unknown error occurred');
      }

      // Store the last sync time
      setLastSyncTime(new Date().toISOString());
      
      toast({
        title: "Employee sync successful",
        description: `Synced ${response.data?.count || 0} employees from BambooHR`,
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
              disabled={isSyncing || !currentUser || !isAdmin}
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
            {currentUser && !isAdmin && (
              <p className="text-xs text-red-600">
                Administrator access required for this operation
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
