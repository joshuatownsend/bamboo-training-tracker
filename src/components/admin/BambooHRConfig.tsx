
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { BAMBOO_HR_CONFIG, isBambooConfigured, getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BambooHRClient } from '@/lib/bamboohr/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BambooHRConfig: React.FC = () => {
  const [subdomain, setSubdomain] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showApiKeyFormat, setShowApiKeyFormat] = useState<boolean>(false);
  const [isUsingEdgeFunction, setIsUsingEdgeFunction] = useState<boolean>(true);

  useEffect(() => {
    // Check if BambooHR is already configured
    const configured = isBambooConfigured();
    setIsConfigured(configured);
    
    // Get effective configuration
    const config = getEffectiveBambooConfig();
    if (config.subdomain && config.subdomain !== 'managed-by-edge-function') setSubdomain(config.subdomain);
    if (config.apiKey && config.apiKey !== 'managed-by-edge-function') setApiKey('••••••••••••'); // Don't show actual API key for security
    
    // Check if using Edge Function
    setIsUsingEdgeFunction(config.useEdgeFunction || false);
    
    console.log('BambooHR config status:', configured ? 'Configured' : 'Not configured');
    console.log('Using Edge Function:', config.useEdgeFunction);
  }, []);

  const handleSaveConfig = async () => {
    // When using Edge Function, we don't need to test or save credentials locally
    if (isUsingEdgeFunction) {
      toast({
        title: 'Using Edge Function',
        description: 'BambooHR credentials are managed by the Supabase Edge Function. Please set the BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY environment variables in your Supabase project.',
      });
      return;
    }

    if (!subdomain || !apiKey) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both the BambooHR subdomain and API key.',
        variant: 'destructive',
      });
      return;
    }

    // Clean the subdomain (remove any .bamboohr.com if present)
    const cleanedSubdomain = subdomain.replace(/\.bamboohr\.com$/i, '');
    if (cleanedSubdomain !== subdomain) {
      setSubdomain(cleanedSubdomain);
      toast({
        title: 'Subdomain Adjusted',
        description: 'Removed ".bamboohr.com" from subdomain - only the company prefix is needed.',
      });
    }

    setIsLoading(true);
    setErrorDetails('');
    setTestStatus('testing');

    try {
      // First try direct fetch to test connection
      const client = new BambooHRClient({
        subdomain: cleanedSubdomain,
        apiKey,
        useEdgeFunction: false // Test direct connection
      });
      
      console.log('Testing BambooHR connection to subdomain:', cleanedSubdomain);
      
      try {
        // Try to fetch meta/fields which is a lightweight endpoint 
        const response = await client.fetchFromBamboo('/meta/fields');
        
        if (response) {
          console.log('BambooHR connection successful, response:', response);
          
          // Success path
          setTestStatus('success');
          
          // Save settings to localStorage
          localStorage.setItem('bamboo_subdomain', cleanedSubdomain);
          localStorage.setItem('bamboo_api_key', apiKey);
          
          toast({
            title: 'Configuration Saved',
            description: 'BambooHR connection has been successfully configured!',
          });
          
          setIsConfigured(true);
          
          // Reload the page to refresh queries with new configuration
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          throw new Error('Empty response from BambooHR API');
        }
      } catch (apiError) {
        console.error('API connection error:', apiError);
        
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        
        // Check for specific error patterns
        if (errorMessage.includes('login page') || errorMessage.includes('HTML') || errorMessage.includes('<!DOCTYPE')) {
          setErrorDetails(`Authentication error: ${errorMessage}\n\nBambooHR API authentication issues usually indicate:\n1. Incorrect subdomain format - use only the company prefix (e.g., "acme")\n2. Invalid API key - verify it's a current API key, not a password\n3. Insufficient permissions - the API key needs proper access rights`);
        } else if (errorMessage.includes('CORS')) {
          setErrorDetails(`CORS error: ${errorMessage}\n\nCORS errors are expected when testing directly and not a problem with your credentials.`);
          
          // Since CORS errors are expected, we'll treat this as a "success with warning" 
          // if using the proxy option
          localStorage.setItem('bamboo_subdomain', cleanedSubdomain);
          localStorage.setItem('bamboo_api_key', apiKey);
          localStorage.setItem('bamboo_use_proxy', 'true');
          
          toast({
            title: 'Configuration Saved (with CORS notice)',
            description: 'Your BambooHR credentials have been saved. API will be accessed via proxy.',
          });
          
          setIsConfigured(true);
          
          // Reload with delay
          setTimeout(() => {
            window.location.reload();
          }, 3000);
          return;
        } else {
          setErrorDetails(`API connection failed: ${errorMessage}`);
        }
        
        setTestStatus('error');
      }
    } catch (error) {
      console.error('BambooHR connection setup error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to BambooHR API.';
      setErrorDetails(errorMessage);
      setTestStatus('error');
      
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to BambooHR. See details below.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConfig = () => {
    localStorage.removeItem('bamboo_subdomain');
    localStorage.removeItem('bamboo_api_key');
    localStorage.removeItem('bamboo_use_proxy');
    setSubdomain('');
    setApiKey('');
    setIsConfigured(false);
    setErrorDetails('');
    setTestStatus('idle');
    toast({
      title: 'Configuration Cleared',
      description: 'BambooHR connection settings have been removed.',
    });
    
    // Reload to clear any cached data
    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
        {isUsingEdgeFunction && (
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
              <p className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-blue-100"
                  onClick={() => window.open('https://supabase.com/dashboard/project/_/settings/secrets', '_blank')}
                >
                  Open Supabase Secrets Manager
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!isUsingEdgeFunction && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="subdomain">BambooHR Subdomain</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="p-0 h-5 w-5">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Your BambooHR subdomain is the unique prefix in your BambooHR URL.<br />
                        Example: for "acme.bamboohr.com", enter "acme"
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="subdomain"
                placeholder="your-company"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">
                  This is the prefix in your BambooHR URL: https://<strong>[your-company]</strong>.bamboohr.com
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 ml-2 text-xs"
                  onClick={() => window.open('https://help.bamboohr.com/hc/en-us/articles/229628187-API-Authentication', '_blank')}
                >
                  BambooHR Help <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="p-0 h-5 w-5">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p>Generate an API key in BambooHR by:</p>
                        <ol className="list-decimal ml-4 text-xs">
                          <li>Logging in as an admin</li>
                          <li>Going to your avatar → Account</li>
                          <li>Select API Keys</li>
                          <li>Generate a new key</li>
                        </ol>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your BambooHR API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Generate an API key in BambooHR under Account → API Keys
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowApiKeyFormat(!showApiKeyFormat)}
                >
                  {showApiKeyFormat ? 'Hide Format' : 'Show API Key Format'}
                </Button>
              </div>
              
              {showApiKeyFormat && (
                <div className="p-2 bg-gray-50 rounded-md text-xs">
                  <p className="text-muted-foreground">Valid API Key Format Example:</p>
                  <code className="bg-gray-100 p-1 rounded">7ed5752ba65626248d4217cb9ab26a840a853374</code>
                  <p className="mt-1 text-muted-foreground">A BambooHR API key is a long string of letters and numbers, not a username/password.</p>
                </div>
              )}
            </div>
            
            {testStatus === 'error' && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{errorDetails}</p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm flex items-center font-medium text-amber-800 mb-1">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Important Note About BambooHR API
                  </p>
                  <p className="text-xs text-amber-700">
                    <strong>Common Issues:</strong>
                    <br />
                    1. <strong>Incorrect subdomain format</strong> - Make sure you're only entering the company prefix (e.g., "acme", not "acme.bamboohr.com")
                    <br />
                    2. <strong>Invalid API key</strong> - The key should be a long string of letters and numbers
                    <br />
                    3. <strong>API key permissions</strong> - The key needs read access to employee data
                    <br />
                    4. <strong>BambooHR account type</strong> - Your BambooHR subscription must include API access
                    <br /><br />
                    Click "Save Configuration" to store your credentials and try with the proxy or "Save Anyway" to bypass the connection test.
                  </p>
                </div>
              </div>
            )}
            
            {testStatus === 'success' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm flex items-center font-medium text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" /> Connection successful!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Successfully connected to BambooHR API. Your configuration has been saved.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isUsingEdgeFunction) {
              window.open('https://supabase.com/dashboard/project/_/functions', '_blank');
            } else {
              clearConfig();
            }
          }} 
          disabled={isLoading}
        >
          {isUsingEdgeFunction ? 'Manage Edge Functions' : 'Clear Connection'}
        </Button>
        <div className="flex gap-2">
          {testStatus === 'error' && !isUsingEdgeFunction && (
            <Button 
              onClick={() => {
                // Save anyway despite connection test failure
                localStorage.setItem('bamboo_subdomain', subdomain);
                localStorage.setItem('bamboo_api_key', apiKey);
                localStorage.setItem('bamboo_use_proxy', 'true');
                toast({
                  title: 'Configuration Saved',
                  description: 'BambooHR credentials saved. API connections will use the proxy.',
                });
                setIsConfigured(true);
                setTimeout(() => window.location.reload(), 1500);
              }}
              variant="secondary"
              disabled={isLoading}
            >
              Save Anyway
            </Button>
          )}
          <Button 
            onClick={isUsingEdgeFunction ? 
              () => window.open('https://supabase.com/dashboard/project/_/settings/secrets', '_blank') : 
              handleSaveConfig
            } 
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {isUsingEdgeFunction ? 
              'Manage Supabase Secrets' : 
              (isLoading ? 'Testing Connection...' : isConfigured ? 'Update Connection' : 'Connect to BambooHR')
            }
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BambooHRConfig;
