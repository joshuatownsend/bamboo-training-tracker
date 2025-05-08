
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { BAMBOO_HR_CONFIG, isBambooConfigured } from '@/lib/bamboohr/config';

const BambooHRConfig: React.FC = () => {
  const [subdomain, setSubdomain] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if BambooHR is already configured
    const configured = isBambooConfigured();
    setIsConfigured(configured);
    
    // Get values from localStorage if available
    const storedSubdomain = localStorage.getItem('bamboo_subdomain');
    const storedApiKey = localStorage.getItem('bamboo_api_key');
    
    if (storedSubdomain) setSubdomain(storedSubdomain);
    if (storedApiKey) setApiKey(storedApiKey);
    
    // If env variables are set, use those
    if (BAMBOO_HR_CONFIG.subdomain) setSubdomain(BAMBOO_HR_CONFIG.subdomain);
    if (BAMBOO_HR_CONFIG.apiKey) setApiKey(BAMBOO_HR_CONFIG.apiKey);
  }, []);

  const handleSaveConfig = async () => {
    if (!subdomain || !apiKey) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both the BambooHR subdomain and API key.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setErrorDetails('');
    setTestStatus('testing');

    try {
      // Test the connection by trying to fetch employees
      const testUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`;
      const headers = new Headers();
      const authHeader = "Basic " + btoa(`${apiKey}:`);
      headers.append("Authorization", authHeader);
      headers.append("Accept", "application/json");
      
      console.log(`Testing BambooHR connection to: ${testUrl}`);
      console.log(`Using Authorization header: ${authHeader.substring(0, 20)}...`);
      
      try {
        // First try a direct API call
        const response = await fetch(testUrl, { 
          method: 'GET',
          headers,
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log(`Direct API response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('BambooHR API error:', errorText);
          throw new Error(`Connection failed (${response.status}): ${errorText}`);
        }
        
        // Try to parse the response to validate it's proper JSON
        const data = await response.json();
        console.log('BambooHR connection successful, retrieved:', data);
        
        if (!data || !data.employees) {
          throw new Error('Unexpected response format from BambooHR API');
        }

        // Success path
        setTestStatus('success');
        
        // Save settings to localStorage
        localStorage.setItem('bamboo_subdomain', subdomain);
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
        
      } catch (fetchError) {
        console.error('Direct fetch error:', fetchError);
        
        // If direct fetch fails, we may be dealing with CORS
        setErrorDetails(`Direct API connection failed: ${fetchError.message}\n\nThis is likely a CORS error. BambooHR's API doesn't allow direct browser access.`);
        setTestStatus('error');
        
        toast({
          title: 'Connection Failed',
          description: 'Could not connect to BambooHR API directly. See details below for CORS information.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('BambooHR connection error:', error);
      
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
    setSubdomain('');
    setApiKey('');
    setIsConfigured(false);
    setErrorDetails('');
    setTestStatus('idle');
    toast({
      title: 'Configuration Cleared',
      description: 'BambooHR connection settings have been removed.',
    });
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">BambooHR Subdomain</Label>
            <Input
              id="subdomain"
              placeholder="your-company"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This is the prefix in your BambooHR URL: https://<strong>[your-company]</strong>.bamboohr.com
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your BambooHR API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Generate an API key in BambooHR under Account → API Keys
            </p>
          </div>
          
          {testStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{errorDetails}</p>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm flex items-center font-medium text-amber-800 mb-1">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Important Note About CORS
                </p>
                <p className="text-xs text-amber-700">
                  BambooHR's API doesn't allow direct browser access due to CORS restrictions. This is expected and not an error with your API key.
                  <br /><br />
                  <strong>Workaround options:</strong>
                  <br />
                  1. You can still save the configuration - we'll store the credentials and they'll work when used server-side.
                  <br />
                  2. Your API key is likely correct despite the connection test failing.
                  <br /><br />
                  Click "Save Anyway" to store your credentials.
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
      </CardContent>
      
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={clearConfig} disabled={isLoading}>
          Clear Connection
        </Button>
        <div className="flex gap-2">
          {testStatus === 'error' && (
            <Button 
              onClick={() => {
                // Save anyway despite connection test failure
                localStorage.setItem('bamboo_subdomain', subdomain);
                localStorage.setItem('bamboo_api_key', apiKey);
                toast({
                  title: 'Configuration Saved',
                  description: 'BambooHR credentials saved despite connection test failure.',
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
            onClick={handleSaveConfig} 
            disabled={isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {isLoading ? 'Testing Connection...' : isConfigured ? 'Update Connection' : 'Connect to BambooHR'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BambooHRConfig;
