
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { BambooHRClient } from '@/lib/bamboohr/client';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const BambooConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [endpointPath, setEndpointPath] = useState('/employees/directory');
  const { toast } = useToast();

  // Get the current config
  const config = getEffectiveBambooConfig();
  
  const runTest = async () => {
    setIsLoading(true);
    setStatus('idle');
    setError(null);
    setResponseData(null);
    
    try {
      const client = new BambooHRClient({
        subdomain: config.subdomain,
        apiKey: config.apiKey,
        useEdgeFunction: config.useEdgeFunction,
        edgeFunctionUrl: config.edgeFunctionUrl
      });
      
      // First, test if we can get a response at all
      const response = await client.fetchRawResponse(endpointPath);
      console.log("BambooHR test response:", response.status);
      
      // Try to get the response body
      let jsonData = null;
      let textData = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          jsonData = await response.json();
          setResponseData(jsonData);
        } else {
          textData = await response.text();
          setResponseData({ text: textData });
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setResponseData({ 
          error: "Failed to parse response", 
          details: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
      
      if (response.ok) {
        setStatus('success');
        toast({
          title: "Connection Successful",
          description: `Got HTTP ${response.status} response from BambooHR`,
          variant: "default"
        });
      } else {
        setStatus('error');
        setError(`HTTP Error ${response.status}: ${response.statusText}`);
        toast({
          title: "Connection Failed",
          description: `Got HTTP ${response.status} from BambooHR`,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("BambooHR connection test error:", err);
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      
      toast({
        title: "Connection Test Failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">BambooHR API Test</h1>
        <Button asChild variant="outline">
          <Link to="/admin-settings">Back to Settings</Link>
        </Button>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>API Diagnostic Tool</AlertTitle>
        <AlertDescription>
          This tool helps troubleshoot BambooHR API connection issues. It will attempt to connect to
          the BambooHR API using your current configuration.
        </AlertDescription>
      </Alert>
      
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
          <Button onClick={runTest} disabled={isLoading}>
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
      
      {status !== 'idle' && (
        <Card className={status === 'success' ? 'border-green-300' : 'border-red-300'}>
          <CardHeader className={status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
            <CardTitle className="flex items-center">
              {status === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> 
                  Connection Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 mr-2 text-red-600" /> 
                  Connection Failed
                </>
              )}
            </CardTitle>
            {error && <CardDescription className="text-red-700">{error}</CardDescription>}
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="response">
                <AccordionTrigger>Response Data</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
                    <pre>{JSON.stringify(responseData, null, 2)}</pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BambooConnectionTest;
