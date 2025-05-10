
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

interface ConnectionConfigProps {
  endpointPath: string;
  setEndpointPath: (path: string) => void;
  isLoading: boolean;
  runTest: () => Promise<void>;
  config: ReturnType<typeof getEffectiveBambooConfig>;
}

const ConnectionConfig: React.FC<ConnectionConfigProps> = ({
  endpointPath,
  setEndpointPath,
  isLoading,
  runTest,
  config
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Configuration</CardTitle>
        <CardDescription>Current BambooHR integration settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Label>Integration Method</Label>
            <div className="p-2 bg-gray-50 rounded border">
              {config.useEdgeFunction ? (
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Using Supabase Edge Function (Recommended)
                </div>
              ) : (
                <div className="flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                  Direct API Access (Legacy)
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label>Edge Function URL</Label>
            <div className="p-2 bg-gray-50 rounded border text-sm font-mono break-all">
              {config.edgeFunctionUrl}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Label>BambooHR Subdomain</Label>
            <div className="p-2 bg-gray-50 rounded border text-sm">
              {config.subdomain}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 gap-2">
            <Label>API Test Endpoint</Label>
            <Input 
              value={endpointPath} 
              onChange={(e) => setEndpointPath(e.target.value)}
              placeholder="/employees/directory"
            />
            <p className="text-xs text-muted-foreground">
              Common endpoints: /employees/directory, /meta/fields, /meta/lists
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runTest} 
          disabled={isLoading} 
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Test Connection
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConnectionConfig;
