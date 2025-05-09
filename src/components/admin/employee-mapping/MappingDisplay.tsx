
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { EmployeeMapping } from '@/hooks/useEmployeeMapping';
import { MappingsTable } from './MappingsTable';
import { NoMappingsAlert } from './NoMappingsAlert';
import { LoadingState } from './LoadingState';

interface MappingDisplayProps {
  mappings: EmployeeMapping[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const MappingDisplay = ({ 
  mappings, 
  loading, 
  onDelete,
  onRefresh 
}: MappingDisplayProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter mappings based on search query
  const filteredMappings = mappings.filter(mapping => 
    mapping.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mapping.bamboo_employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between flex-wrap gap-2">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search mappings..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Mappings display */}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          {filteredMappings.length === 0 ? (
            <NoMappingsAlert searchQuery={searchQuery} />
          ) : (
            <MappingsTable 
              mappings={filteredMappings}
              onDelete={onDelete}
            />
          )}
        </>
      )}

      <div className="text-xs text-muted-foreground">
        {filteredMappings.length} mapping{filteredMappings.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
};
