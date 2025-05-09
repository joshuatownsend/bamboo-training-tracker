
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, ExternalLink, RefreshCw, Wrench } from 'lucide-react';
import { isBambooConfigured, getEffectiveBambooConfig, setUseEdgeFunction } from '@/lib/bamboohr/config';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useBambooHR from '@/hooks/useBambooHR';
import { Link } from 'react-router-dom';

const BambooHRConfig: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isUsingEdgeFunction, setIsUsingEdgeFunction] = useState<boolean>(true);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { getBambooService } = useBambooHR();

  useEffect(() => {
    // Check if BambooHR is already configured
    const configured = isBambooConfigured();
    setIsConfigured(configured);
    
    // Get effective configuration
    const config = getEffectiveBambooConfig();
    
    // Check if using Edge Function
    setIsUsingEdgeFunction(config.useEdgeFunction || false);
    
    console.log('BambooHR config status:', configured ? 'Configured' : 'Not configured');
    console.log('Using Edge Function:', config.useEdgeFunction);
  }, []);

  const enableEdgeFunction = () => {
    setUseEdgeFunction(true);
    setIsUsingEdgeFunction(true);
    setIsConfigured(true);
    
    toast({
      title: 'Edge Function Enabled',
      description: 'BambooHR integration will now use the Supabase Edge Function.',
    });
    
    // Reload the page to refresh queries with new configuration
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('untested');
    setErrorMessage(null);
    
    try {
      const service = getBambooService();
      const success = await service.testConnection();
      
      setConnectionStatus(success ? 'success' : 'error');
      
      if (success) {
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to BambooHR API.',
          variant: 'default',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      
      toast({
        title: 'Connection Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="border-yellow-300">
      <CardHeader className={isConfigured ? "bg-green-50" : "bg-yellow-50"}>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          BambooHR Integration
        </CardTitle>
        <CardDescription>
          Connect to BambooHR to import employee data and training records.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Edge Function Integration</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              BambooHR integration is now handled by a Supabase Edge Function. This eliminates CORS issues and 
              provides better security by keeping your BambooHR credentials on the server.
            </p>
            <p className="mt-2">
              Please set the following secrets in your Supabase project:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li><strong>BAMBOOHR_SUBDOMAIN</strong> - Your BambooHR company subdomain</li>
              <li><strong>BAMBOOHR_API_KEY</strong> - Your BambooHR API key</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-100"
                onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/secrets', '_blank')}
              >
                Open Supabase Secrets Manager
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              
              <Button
                variant={connectionStatus === 'success' ? "outline" : "default"}
                size="sm"
                onClick={testConnection}
                disabled={isTestingConnection}
                className={connectionStatus === 'success' ? "bg-green-100 text-green-800" : ""}
              >
                {isTestingConnection ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : connectionStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isTestingConnection ? "Testing..." : connectionStatus === 'success' ? "Connection Verified" : "Test Connection"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-100 text-amber-800"
                asChild
              >
                <Link to="/bamboo-test">
                  <Wrench className="h-4 w-4 mr-2" />
                  Advanced Diagnostics
                </Link>
              </Button>
            </div>
            
            {connectionStatus === 'error' && errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <p className="font-semibold">Connection Error:</p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            )}
            
            {connectionStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                <p className="font-semibold">Connection Successful!</p>
                <p className="mt-1">Your BambooHR credentials are valid and working.</p>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {!isUsingEdgeFunction && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="text-lg font-medium flex items-center text-amber-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              Legacy Direct API Method Detected
            </h3>
            <p className="mt-2 text-sm text-amber-700">
              You're currently using the legacy direct API method which is prone to CORS errors and is not recommended.
              We strongly suggest switching to the Edge Function method for improved reliability and security.
            </p>
            <Button 
              className="mt-4 bg-green-600 hover:bg-green-700 text-white"
              onClick={enableEdgeFunction}
            >
              Enable Edge Function Method
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions', '_blank')}>
          Manage Edge Functions
        </Button>
        <Button 
          onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/secrets', '_blank')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          Manage Supabase Secrets
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BambooHRConfig;
