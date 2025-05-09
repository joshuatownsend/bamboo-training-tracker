
import { RefreshCw, Database, CloudSun } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  loading: boolean;
  mappingLoading: boolean;
  syncingEmployees: boolean;
  onRefresh: () => void;
  onAutoMap: () => void;
  onSyncFromBambooHR: () => void;
}

export const ActionButtons = ({ 
  loading, 
  mappingLoading, 
  syncingEmployees, 
  onRefresh, 
  onAutoMap, 
  onSyncFromBambooHR 
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading || mappingLoading}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onAutoMap}
        disabled={loading || mappingLoading}
      >
        <Database className="mr-2 h-4 w-4" />
        Map from Local Cache
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onSyncFromBambooHR}
        disabled={syncingEmployees}
        className="bg-yellow-500 hover:bg-yellow-600 text-black"
      >
        <CloudSun className={`mr-2 h-4 w-4 ${syncingEmployees ? 'animate-spin' : ''}`} />
        Sync from BambooHR
      </Button>
    </div>
  );
};
