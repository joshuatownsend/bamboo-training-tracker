
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBambooSync } from "@/hooks/cache/useBambooSync";
import { supabase } from "@/integrations/supabase/client";
import { Employee, Training, TrainingCompletion } from "@/lib/types";
import { CachedEmployee, CachedTraining, CachedCompletion } from "@/types/bamboo";

// Import refactored components
import { 
  StatusBadge, 
  SyncStatusSummary, 
  CachedDataSummary, 
  TroubleshootingTools, 
  SyncButton 
} from "./bamboo-sync";

export function BambooHRSyncStatus() {
  const { toast } = useToast();
  const { 
    syncStatus, 
    isSyncStatusLoading, 
    employees,
    trainings,
    completions,
    isEmployeesLoading,
    isTrainingsLoading,
    isCompletionsLoading,
    refetchAll
  } = useEmployeeCache();
  
  const {
    triggerSync,
    isSyncing,
    syncError
  } = useBambooSync();
  
  const [showDataDetails, setShowDataDetails] = React.useState(false);
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);
  const [localIsSyncing, setLocalIsSyncing] = React.useState(false);
  
  // Performance tracking for the sync operation
  const [syncStartTime, setSyncStartTime] = React.useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = React.useState<number>(Date.now());
  
  // Monitor sync status automatically
  React.useEffect(() => {
    if (syncStatus?.status === 'running') {
      const interval = setInterval(() => {
        refetchAll();
      }, 5000); // Check every 5 seconds when sync is running
      
      return () => clearInterval(interval);
    }
  }, [syncStatus?.status, refetchAll]);
  
  // Load data when component mounts
  React.useEffect(() => {
    refetchAll();
  }, []);
  
  // Convert data types for the components
  const mappedEmployees: CachedEmployee[] = React.useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      first_name: emp.first_name,
      last_name: emp.last_name,
      department: emp.department,
      email: emp.email,
      position: emp.position,
      job_title: emp.job_title,
      division: emp.division,
      work_email: emp.work_email,
      display_name: emp.display_name,
      avatar: emp.avatar,
      hire_date: emp.hire_date
    }));
  }, [employees]);

  const mappedTrainings: CachedTraining[] = React.useMemo(() => {
    return trainings.map(train => ({
      id: train.id,
      title: train.title,
      name: train.title,
      type: train.type,
      category: train.category,
      description: train.description,
      duration_hours: train.duration_hours,
      required_for: train.required_for
    }));
  }, [trainings]);

  const mappedCompletions: CachedCompletion[] = React.useMemo(() => {
    return completions.map(comp => ({
      id: comp.id,
      employee_id: comp.employee_id,
      training_id: comp.training_id,
      completion_date: comp.completion_date,
      expiration_date: comp.expiration_date,
      status: comp.status as string,
      score: comp.score,
      certificate_url: comp.certificate_url
    }));
  }, [completions]);
  
  const handleRefresh = async () => {
    setLastRefreshTime(Date.now());
    await refetchAll();
    
    toast({
      title: "Data Refreshed",
      description: "Cache status has been refreshed.",
    });
  };
  
  const handleSync = async () => {
    setLocalIsSyncing(true);
    const startTime = performance.now();
    setSyncStartTime(startTime);
    
    toast({
      title: "Sync Started",
      description: "BambooHR data synchronization initiated...",
    });
    
    try {
      const { data, error } = await supabase.rpc('trigger_bamboohr_sync');
      
      if (error) {
        console.error("RPC error triggering sync:", error);
        throw new Error(`Database function error: ${error.message}`);
      }
      
      // Check if the response contains an error
      if (data && typeof data === 'object' && 'error' in data && data.error) {
        console.error("Sync returned error in data:", data.error);
        throw new Error(`Sync returned error: ${data.error}`);
      }
      
      console.log("Sync triggered successfully, response:", data);
      
      toast({
        title: "Sync Request Successful",
        description: "Sync process has started. Data will be available shortly.",
      });
      
      // Poll for status updates
      await refetchAll();
      
      // Poll for status updates every few seconds
      const pollInterval = setInterval(async () => {
        await refetchAll();
        const currentStatus = syncStatus?.status;
        
        if (currentStatus === 'success' || currentStatus === 'error') {
          clearInterval(pollInterval);
          
          // Calculate how long the sync took
          const endTime = performance.now();
          const syncDuration = syncStartTime ? ((endTime - syncStartTime) / 1000).toFixed(1) : 'unknown';
          
          if (currentStatus === 'success') {
            toast({
              title: "Sync Complete",
              description: `BambooHR data has been successfully synchronized in ${syncDuration}s.`,
              variant: "default",
              className: "bg-green-50 border-green-200 text-green-800"
            });
          } else if (currentStatus === 'error') {
            toast({
              title: "Sync Error",
              description: syncStatus?.error || "An error occurred during synchronization.",
              variant: "destructive"
            });
          }
          
          setSyncStartTime(null);
        }
      }, 5000); // Check every 5 seconds
      
      // Set a timeout to stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setSyncStartTime(null);
        refetchAll(); // One final refresh
      }, 120000); // 2 minutes
      
    } catch (error) {
      setSyncStartTime(null);
      console.error("Error in handleSync:", error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to start synchronization",
        variant: "destructive"
      });
    } finally {
      setLocalIsSyncing(false);
    }
  };
  
  // Format time since last refresh
  const timeSinceRefresh = React.useMemo(() => {
    return formatDistanceToNow(lastRefreshTime, { addSuffix: true });
  }, [lastRefreshTime]);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>BambooHR Data Sync</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isSyncStatusLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncStatusLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Employee data is synced automatically every 6 hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSyncStatusLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <SyncStatusSummary 
              syncStatus={syncStatus}
              timeSinceRefresh={timeSinceRefresh}
              isSyncStatusLoading={isSyncStatusLoading}
            />
            
            <CachedDataSummary 
              employees={mappedEmployees}
              trainings={mappedTrainings}
              completions={mappedCompletions}
              isEmployeesLoading={isEmployeesLoading}
              isTrainingsLoading={isTrainingsLoading}
              isCompletionsLoading={isCompletionsLoading}
              showDataDetails={showDataDetails}
              setShowDataDetails={setShowDataDetails}
            />
            
            <TroubleshootingTools 
              showDebugInfo={showDebugInfo}
              setShowDebugInfo={setShowDebugInfo}
              handleRefresh={handleRefresh}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <SyncButton 
          handleSync={handleSync}
          isSyncing={localIsSyncing} 
          syncStartTime={syncStartTime}
          syncStatus={syncStatus}
        />
      </CardFooter>
    </Card>
  );
}
