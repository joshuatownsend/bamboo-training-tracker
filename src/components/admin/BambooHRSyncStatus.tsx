
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useEmployeeCache from "@/hooks/useEmployeeCache";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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
    triggerSync,
    employees,
    trainings,
    completions,
    isEmployeesLoading,
    isTrainingsLoading,
    isCompletionsLoading,
    refetchAll
  } = useEmployeeCache();
  
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [showDataDetails, setShowDataDetails] = React.useState(false);
  
  // Performance tracking for the sync operation
  const [syncStartTime, setSyncStartTime] = React.useState<number | null>(null);
  
  const handleSync = async () => {
    setIsSyncing(true);
    const startTime = performance.now();
    setSyncStartTime(startTime);
    
    toast({
      title: "Sync Started",
      description: "BambooHR data synchronization initiated...",
    });
    
    try {
      await triggerSync();
      
      toast({
        title: "Sync Request Successful",
        description: "Sync process has started. Data will be available shortly.",
      });
      
      // Poll for status updates every few seconds
      const pollInterval = setInterval(async () => {
        await refetchAll();
        const currentStatus = syncStatus?.status;
        
        if (currentStatus === 'success' || currentStatus === 'error') {
          clearInterval(pollInterval);
          setIsSyncing(false);
          
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
      }, 3000); // Check every 3 seconds
      
      // Set a timeout to stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isSyncing) {
          setIsSyncing(false);
          toast({
            title: "Sync Timeout",
            description: "The sync process is taking longer than expected. You can check back later.",
            variant: "default",
            className: "bg-yellow-50 border-yellow-200 text-yellow-800"
          });
          
          setSyncStartTime(null);
        }
      }, 120000); // 2 minutes
    } catch (error) {
      setIsSyncing(false);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to start synchronization",
        variant: "destructive"
      });
      
      setSyncStartTime(null);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">BambooHR Data Sync</CardTitle>
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
              
              {syncStatus?.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                  <p className="font-medium">Error message:</p>
                  <p className="mt-1">{syncStatus.error}</p>
                </div>
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
                        const date = new Date(c.completionDate);
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
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSync} 
          disabled={isSyncStatusLoading || isSyncing || syncStatus?.status === 'running'}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing 
            ? syncStartTime 
              ? `Syncing... (${((performance.now() - syncStartTime) / 1000).toFixed(1)}s)` 
              : "Syncing..." 
            : "Sync Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
