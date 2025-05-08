import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from '@/hooks/useBambooHR';
import { getEffectiveBambooConfig, setUseProxyFlag } from '@/lib/bamboohr/config';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BambooTroubleshooting = () => {
  const [testResults, setTestResults] = useState<{
    step: string;
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tests");
  const [useProxy, setUseProxy] = useState(() => {
    const config = getEffectiveBambooConfig();
    return config.useProxy ?? true;
  });

  const { isConfigured, getBambooService } = useBambooHR();
  
  // Handle proxy toggle
  const handleProxyToggle = (checked: boolean) => {
    setUseProxy(checked);
    setUseProxyFlag(checked);
    toast({
      title: "Proxy Setting Updated",
      description: checked 
        ? "Now using the server-side proxy to access BambooHR API." 
        : "Now attempting to access BambooHR API directly (may cause CORS errors).",
      duration: 3000
    });
  };
  
  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Step 1: Check configuration
    const config = getEffectiveBambooConfig();
    let results: any[] = [{
      step: 'Configuration Check',
      status: isConfigured ? 'success' : 'error',
      message: isConfigured 
        ? `Configuration found: subdomain=${config.subdomain}, API key present: ${Boolean(config.apiKey)}, Proxy: ${config.useProxy ? 'Enabled' : 'Disabled'}`
        : 'BambooHR not configured. Please add your subdomain and API key in Admin Settings.'
    }];
    setTestResults(results);
    
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }
    
    // Step 2: Test API connection
    try {
      results = [...results, {
        step: 'API Connection Test',
        status: 'testing',
        message: 'Testing connection to BambooHR API...'
      }];
      setTestResults(results);
      
      const service = getBambooService();
      await service.testConnection();
      
      results[results.length - 1] = {
        step: 'API Connection Test',
        status: 'success',
        message: 'Connection to BambooHR API successful!'
      };
      setTestResults(results);
      
      // Step 3: Fetch employees
      results = [...results, {
        step: 'Fetch Employees',
        status: 'testing',
        message: 'Attempting to fetch employees...'
      }];
      setTestResults(results);
      
      const employees = await service.getEmployees();
      
      results[results.length - 1] = {
        step: 'Fetch Employees',
        status: employees.length > 0 ? 'success' : 'error',
        message: employees.length > 0
          ? `Successfully fetched ${employees.length} employees.`
          : 'No employees returned. This could be due to CORS restrictions or an empty employee directory.'
      };
      setTestResults(results);
      
      // Step 4: Fetch trainings
      results = [...results, {
        step: 'Fetch Trainings',
        status: 'testing',
        message: 'Attempting to fetch trainings...'
      }];
      setTestResults(results);
      
      try {
        const trainings = await service.getTrainings();
        results[results.length - 1] = {
          step: 'Fetch Trainings',
          status: 'success',
          message: `Successfully fetched ${trainings.length} trainings.`
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'Fetch Trainings',
          status: 'error',
          message: `Error fetching trainings: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      setTestResults(results);
      
      // Step 5: Fetch all data
      results = [...results, {
        step: 'Fetch All Data',
        status: 'testing',
        message: 'Attempting to fetch all data (employees, trainings, completions)...'
      }];
      setTestResults(results);
      
      try {
        const allData = await service.fetchAllData();
        results[results.length - 1] = {
          step: 'Fetch All Data',
          status: 'success',
          message: `Successfully fetched all data. Employees: ${allData.employees?.length || 0}, Trainings: ${allData.trainings?.length || 0}, Completions: ${allData.completions?.length || 0}`
        };
      } catch (error) {
        results[results.length - 1] = {
          step: 'Fetch All Data',
          status: 'error',
          message: `Error fetching all data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      setTestResults(results);
      
    } catch (error) {
      console.error('Test error:', error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let helpText = '';
      
      // Detect common error types and provide helpful messages
      if (errorMessage.includes('HTML instead of JSON') || errorMessage.includes('Unexpected token')) {
        helpText = `
          This typically means one of:
          1. Incorrect subdomain - Check that "${config.subdomain}" is correct
          2. Invalid API key format - Ensure API key is copied correctly
          3. BambooHR is returning a login page instead of API data
          
          Try refreshing your API key in BambooHR admin panel and ensure your subdomain matches your company's BambooHR URL.
        `;
      } else if (errorMessage.includes('CORS')) {
        helpText = 'CORS errors are expected when accessing BambooHR directly. Try enabling the proxy option.';
      }
      
      results[results.length - 1] = {
        step: results[results.length - 1].step,
        status: 'error',
        message: `Error: ${errorMessage}${helpText ? '\n\n' + helpText : ''}`
      };
      setTestResults(results);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">BambooHR Connection Troubleshooting</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="tests">Connection Tests</TabsTrigger>
          <TabsTrigger value="proxy">Proxy Settings</TabsTrigger>
          <TabsTrigger value="solutions">CORS Solutions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Connection Diagnostics</CardTitle>
              <CardDescription>
                Run tests to check the connection to BambooHR and diagnose any issues.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center mb-6">
                <Button 
                  onClick={runTests}
                  disabled={isLoading} 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Run Connection Tests
                </Button>
                <p className="ml-4 text-sm text-muted-foreground">
                  {isConfigured ? 'BambooHR configuration detected.' : 'BambooHR is not configured.'}
                </p>
              </div>
              
              {isLoading && testResults.length === 0 && (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}
              
              {testResults.length > 0 && (
                <div className="space-y-4 border rounded-md p-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {result.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      )}
                      {result.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-1" />
                      )}
                      {result.status === 'testing' && (
                        <div className="h-5 w-5 rounded-full border-2 border-t-yellow-500 animate-spin mt-1" />
                      )}
                      <div>
                        <h3 className="font-medium">{result.step}</h3>
                        <p className={`text-sm ${
                          result.status === 'error' 
                            ? 'text-red-700' 
                            : result.status === 'success' 
                              ? 'text-green-700' 
                              : 'text-muted-foreground'
                        }`}>
                          {result.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between bg-muted/20 border-t p-4">
              <div className="text-sm text-muted-foreground">
                <p>Subdomain: <code>{getEffectiveBambooConfig().subdomain || 'Not set'}</code></p>
                <p>API Key: <code>{getEffectiveBambooConfig().apiKey ? '••••••••' : 'Not set'}</code></p>
                <p>Proxy: <code>{getEffectiveBambooConfig().useProxy ? 'Enabled' : 'Disabled'}</code></p>
              </div>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>
                Troubleshooting steps for common BambooHR connection issues
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">CORS Errors</h3>
                <p className="text-sm">
                  The BambooHR API may return CORS errors when accessed directly from a browser. This is normal and not necessarily an error with your configuration.
                  If you see CORS errors but your API key and subdomain are correct, you'll need a server-side proxy to access the API.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Incorrect Subdomain</h3>
                <p className="text-sm">
                  Make sure your subdomain is entered correctly. This is the part of your BambooHR URL that comes before ".bamboohr.com".
                  For example, if your BambooHR URL is "company.bamboohr.com", your subdomain is "company".
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">API Key Permissions</h3>
                <p className="text-sm">
                  Ensure your API key has the necessary permissions. The API key should have read access to employee data and training records.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="proxy">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Configuration</CardTitle>
              <CardDescription>
                Configure the server-side proxy to handle BambooHR API requests
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Server-side Proxy Configured</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        A server-side proxy has been set up to forward requests to the BambooHR API, avoiding CORS issues.
                        Use the toggle below to enable or disable the proxy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="proxy-mode" 
                  checked={useProxy} 
                  onCheckedChange={handleProxyToggle} 
                />
                <Label htmlFor="proxy-mode" className="font-medium">
                  Use Server-side Proxy for BambooHR API
                </Label>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Current setting: <strong>{useProxy ? 'Using proxy (recommended)' : 'Direct API access (not recommended)'}</strong></p>
                <p className="mb-4">
                  The proxy forwards requests from <code>/api/bamboohr/...</code> to <code>https://api.bamboohr.com/...</code> 
                  while handling authentication headers. This helps avoid CORS issues in the browser.
                </p>
                
                <div className="bg-muted rounded-md p-3">
                  <h4 className="font-medium mb-1">How the proxy works:</h4>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Your browser sends an API request to your own server at <code>/api/bamboohr/...</code></li>
                    <li>The Vite dev server proxies this request to the BambooHR API</li>
                    <li>The proxy adds necessary headers and forwards the response back to your browser</li>
                    <li>No CORS errors occur because the request appears to come from the same origin</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="solutions">
          <Card>
            <CardHeader>
              <CardTitle>Understanding CORS Errors</CardTitle>
              <CardDescription>
                Cross-Origin Resource Sharing (CORS) limitations and how to address them
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">CORS Restriction Notice</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        The BambooHR API can't be accessed directly from a browser due to security restrictions called CORS.
                        This is not an error in your configuration - it's a built-in browser security feature.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mt-6">What is CORS?</h3>
              <p className="text-sm">
                Cross-Origin Resource Sharing (CORS) is a security mechanism that prevents web pages from making
                requests to a different domain than the one that served the original page. This is a security feature 
                implemented by all modern browsers.
              </p>
              
              <h3 className="text-lg font-medium mt-4">Solutions to CORS Issues</h3>
              
              <div className="mt-4 space-y-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Option 1: Server-side Proxy</h4>
                  <p className="text-sm mt-2">
                    The most common solution is to create a server-side proxy that makes requests to BambooHR on behalf of your frontend.
                    Your frontend would make requests to your server, which then forwards them to BambooHR.
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    This requires creating a backend API service using Node.js, Python, or another server-side technology.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Option 2: Serverless Function</h4>
                  <p className="text-sm mt-2">
                    Use a serverless function (like AWS Lambda, Vercel Functions, or Netlify Functions) as a proxy.
                    This is similar to a server-side proxy but doesn't require maintaining a full server.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Option 3: Browser Extension</h4>
                  <p className="text-sm mt-2">
                    For development purposes only, you can use browser extensions that disable CORS checks.
                    <strong> Never use this in production</strong> as it compromises security.
                  </p>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium">Option 4: BambooHR Webhooks</h4>
                  <p className="text-sm mt-2">
                    If your BambooHR account supports webhooks, you can set up webhooks to push data to your application
                    instead of having your application pull data from BambooHR.
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mt-6">Recommended Approach</h3>
              <p className="text-sm">
                The most reliable solution is to create a simple backend service that acts as a proxy between your frontend
                application and the BambooHR API. This service would:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                <li>Accept requests from your frontend</li>
                <li>Forward those requests to BambooHR with proper authentication</li>
                <li>Return the responses to your frontend</li>
                <li>Implement proper CORS headers to allow your frontend to access it</li>
              </ul>
              
              <div className="mt-6">
                <Button 
                  variant="outline"
                  className="flex items-center"
                  onClick={() => window.open('https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', '_blank')}
                >
                  Learn more about CORS
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BambooTroubleshooting;
