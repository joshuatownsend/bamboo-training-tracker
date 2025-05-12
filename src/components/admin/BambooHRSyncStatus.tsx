
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useBambooSync } from "@/hooks/cache/useBambooSync";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>;
    case 'running':
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
    case 'error':
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
    case 'never_run':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Never Run</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

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
  
  const handleRefresh = async () => {
    setLastRefreshTime(Date.now());
    await refetchAll();
    
    toast({
      title: "Data Refreshed",
      description: "Cache status has been refreshed.",
    });
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    const startTime = performance.now();
    setSyncStartTime(startTime);
    
    toast({
      title: "Sync Started",
      description: "BambooHR data synchronization initiated...",
    });
    
    try {
      const success = await triggerSync();
      
      if (success) {
        toast({
          title: "Sync Request Successful",
          description: "Sync process has started. Data will be available shortly.",
        });
        
        // Poll for status updates
        await refetchAll();
      }
      
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
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to start synchronization",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Check database connection
  const checkDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('cached_employees')
        .select('count(*)');
      
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {syncStatus ? <StatusBadge status={syncStatus.status} /> : <Badge variant="outline">Unknown</Badge>}
              </div>
              
              {syncStatus?.last_sync && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last sync:</span>
                  <span>{formatDistanceToNow(new Date(syncStatus.last_sync), { addSuffix: true })}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last refreshed:</span>
                <span>{timeSinceRefresh}</span>
              </div>
              
              {syncStatus?.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sync Error</AlertTitle>
                  <AlertDescription className="mt-1 font-mono text-xs break-all">
                    {syncStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="border rounded-md p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Cached Data:</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDataDetails(!showDataDetails)}
                >
                  {showDataDetails ? "Hide Details" : "Show Details"}
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                  {isEmployeesLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-xl font-bold">{employees.length}</span>
                  )}
                  <span className="text-xs text-muted-foreground">Employees</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                  {isTrainingsLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-xl font-bold">{trainings.length}</span>
                  )}
                  <span className="text-xs text-muted-foreground">Trainings</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                  {isCompletionsLoading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-xl font-bold">{completions.length}</span>
                  )}
                  <span className="text-xs text-muted-foreground">Completions</span>
                </div>
              </div>
              
              {showDataDetails && !isEmployeesLoading && !isTrainingsLoading && !isCompletionsLoading && (
                <div className="mt-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employees by department:</span>
                    <span className="font-mono">{new Set(employees.map(e => e.department)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Training categories:</span>
                    <span className="font-mono">{new Set(trainings.map(t => t.category)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recent completions:</span>
                    <span className="font-mono">
                      {completions.filter(c => {
                        const date = c.completion_date ? new Date(c.completion_date) : null;
                        if (!date) return false;
                        const now = new Date();
                        const oneMonthAgo = new Date();
                        oneMonthAgo.setMonth(now.getMonth() - 1);
                        return date >= oneMonthAgo;
                      }).length}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
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
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          onClick={handleSync} 
          disabled={isSyncStatusLoading || isSyncing || syncStatus?.status === 'running'}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing 
            ? syncStartTime 
              ? `Syncing... (${((performance.now() - syncStartTime) / 1000).toFixed(1)}s)` 
              : "Syncing..." 
            : "Sync Now"}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center w-full">
          {syncStatus?.status === 'running' && <span className="animate-pulse">Sync in progress, please wait...</span>}
        </div>
      </CardFooter>
    </Card>
  );
}
