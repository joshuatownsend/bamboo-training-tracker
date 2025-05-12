
import { useState } from 'react';
import { ConnectionStatus } from './bulk-actions/ConnectionStatus';
import { BulkActionButtons } from './bulk-actions/ActionButtons';
import { SyncActions } from './bulk-actions/SyncActions';

interface BulkActionsProps {
  onRefresh: () => void;
}

export const BulkActions = ({ onRefresh }: BulkActionsProps) => {
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Bulk Actions</h3>
      
      <ConnectionStatus 
        connectionStatus={connectionStatus}
        setConnectionStatus={setConnectionStatus}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <BulkActionButtons onRefresh={onRefresh} />
      </div>
      
      <SyncActions onRefresh={onRefresh} />
    </div>
  );
};
