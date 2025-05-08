
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, ExternalLink, Server, Database } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getEffectiveBambooConfig, setUseProxyFlag } from '@/lib/bamboohr/config';
import { BambooHRClient } from '@/lib/bamboohr/client';
import { testBambooHREndpoints } from '@/lib/bamboohr/apiTester';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const BambooTroubleshootingDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(() => {
    const config = getEffectiveBambooConfig();
    return config.useProxy ?? true;
  });
  const [subdomain, setSubdomain] = useState(() => getEffectiveBambooConfig().subdomain || '');

  // Handle proxy toggle
  const handleProxyToggle = (checked: boolean) => {
    setUseProxy(checked);
    setUseProxyFlag(checked);
    localStorage.setItem('bamboo_use_proxy', checked.toString());
    toast({
      title: "Proxy Setting Updated",
      description: checked 
        ? "Now using the server-side proxy to access BambooHR API." 
        : "Now attempting to access BambooHR API directly (may cause CORS errors).",
      duration: 3000
    });
  };

  const runApiTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = getEffectiveBambooConfig();
      
      if (!config.subdomain || !config.apiKey) {
        throw new Error('BambooHR configuration is missing. Please configure your API credentials first.');
      }
      
      // Create a client with current settings
      const client = new BambooHRClient({
        subdomain: config.subdomain,
        apiKey: config.apiKey,
        useProxy: config.useProxy
      });
      
      const testResults = await testBambooHREndpoints(client);
      setResults(testResults);
    } catch (error) {
      console.error('Error running API tests:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubdomain = () => {
    if (!subdomain) {
      toast({
        title: "Subdomain Required",
        description: "Please enter a subdomain to test",
        variant: "destructive"
      });
      return;
    }

    const cleanedSubdomain = subdomain.replace(/\.bamboohr\.com$/i, '');
    localStorage.setItem('bamboo_subdomain', cleanedSubdomain);
    toast({
      title: "Subdomain Updated",
      description: `Subdomain updated to "${cleanedSubdomain}". Run the tests again to verify.`,
      duration: 3000
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">BambooHR API Diagnostics</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Adjust your connection settings before running the API tests.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="subdomain">BambooHR Subdomain</Label>
              <div className="flex mt-1 gap-2">
                <input 
                  id="subdomain"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="Your company's BambooHR subdomain"
                />
                <Button onClick={updateSubdomain}>Update</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is the prefix in your BambooHR URL: https://<strong>[your-company]</strong>.bamboohr.com
              </p>
            </div>
            
            <div className="md:w-1/3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="proxy-mode" 
                  checked={useProxy} 
                  onCheckedChange={handleProxyToggle} 
                />
                <Label htmlFor="proxy-mode" className="font-medium">
                  Use Server-side Proxy
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle to use proxy when accessing the BambooHR API (recommended)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Explorer</CardTitle>
          <CardDescription>
            Test which BambooHR API endpoints are accessible with your current credentials.
            This helps identify the specific structure of your BambooHR instance.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
              <Button 
                onClick={runApiTests}
                disabled={isLoading} 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {isLoading ? 'Testing endpoints...' : 'Run API Endpoint Tests'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                This will attempt to access various BambooHR API endpoints to determine 
                which ones are available with your current credentials.
              </div>
            </div>
            
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Error running API tests</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {results && (
              <>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    API Test Results Summary
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {results.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700">• {recommendation}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Endpoint Test Results</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endpoint
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.map((result: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {result.endpoint}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {result.exists ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Accessible
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Not Found
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {result.responseType ? (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  result.responseType.includes('application/json') 
                                    ? 'bg-green-50 text-green-700' 
                                    : result.responseType.includes('text/html')
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-gray-50 text-gray-700'
                                }`}>
                                  {result.responseType.includes('application/json') 
                                    ? 'JSON' 
                                    : result.responseType.includes('text/html')
                                      ? 'HTML'
                                      : result.responseType}
                                </span>
                              ) : (
                                <span className="text-gray-500">Unknown</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {result.error && (
                                <span className="text-red-600">{result.error}</span>
                              )}
                              {result.data && result.data.type === 'html' && (
                                <span className="text-amber-600">
                                  HTML Page: "{result.data.title}" 
                                  {result.data.isLoginPage ? " (Login Page)" : ""}
                                </span>
                              )}
                              {result.data && result.data.type !== 'html' && result.data.type !== 'unknown' && (
                                <span>
                                  {result.data.isEmpty 
                                    ? "Empty response" 
                                    : `Data available (${result.data.keys?.join(', ')})`}
                                </span>
                              )}
                              {result.data && result.data.type === 'unknown' && (
                                <span className="text-gray-500">
                                  Unrecognized format
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mt-6">
                  <h3 className="font-medium text-amber-800 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    HTML Responses (Login Pages) Instead of JSON Data
                  </h3>
                  <p className="mt-2 text-sm text-amber-700">
                    If you're seeing HTML responses or login pages instead of JSON data, it typically means one of these issues:
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-amber-700">
                    <li><strong>Incorrect subdomain</strong> - Double-check your BambooHR URL to confirm the correct subdomain</li>
                    <li><strong>API key format</strong> - Ensure you're using an API key, not a password</li>
                    <li><strong>Company name vs subdomain</strong> - Sometimes the subdomain differs from your company name; try both</li>
                    <li><strong>API access permissions</strong> - Your API key may not have sufficient permissions</li>
                    <li><strong>BambooHR account level</strong> - Your subscription may not include API access</li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-white rounded border border-amber-100">
                    <h4 className="font-medium text-amber-800">Try These Steps:</h4>
                    <ol className="list-decimal ml-5 text-sm space-y-1 text-amber-700">
                      <li>Visit your BambooHR account in a browser to confirm the exact subdomain</li> 
                      <li>Generate a fresh API key with admin permissions</li>
                      <li>Contact BambooHR support to confirm API access is enabled for your account</li>
                      <li>Check if your company uses a custom domain for BambooHR access</li>
                    </ol>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between bg-muted/20 border-t p-4">
          <div className="text-sm text-muted-foreground">
            <p>Subdomain: <code>{getEffectiveBambooConfig().subdomain || 'Not set'}</code></p>
            <p>API Key: <code>{getEffectiveBambooConfig().apiKey ? '••••••••' : 'Not set'}</code></p>
            <p>Proxy: <code>{getEffectiveBambooConfig().useProxy ? 'Enabled' : 'Disabled'}</code></p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://documentation.bamboohr.com/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              BambooHR API Docs
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Common Solutions</CardTitle>
          <CardDescription>
            Try these approaches to resolve BambooHR API connection issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Company ID vs. Subdomain
            </h3>
            <p className="text-sm">
              Sometimes the issue is related to the difference between your "company identifier" and your "subdomain".
              Your BambooHR URL might be something like "companyname.bamboohr.com", but the API might expect a different
              identifier (like an internal ID or abbreviated name).
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-medium">Try these alternatives:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Your company name exactly as it appears in BambooHR</li>
                <li>The subdomain from your BambooHR URL (before .bamboohr.com)</li>
                <li>An abbreviated version of your company name (if it's long)</li>
                <li>Contact your BambooHR administrator to confirm your company identifier</li>
              </ol>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">API Key Format and Generation</h3>
            <p className="text-sm">
              BambooHR API keys are long strings of letters and numbers. Make sure you're using a proper API key and not a password.
              Generate a new API key in BambooHR by:
            </p>
            <ol className="list-decimal ml-6 text-sm space-y-1">
              <li>Login to BambooHR as an administrator</li>
              <li>Click your avatar in the top-right</li>
              <li>Select "Account" from the dropdown</li>
              <li>Select "API Keys"</li>
              <li>Click "Add New Key"</li>
              <li>Copy the generated key (it should look like <code className="bg-gray-100 px-1 rounded">7ed5752ba65626248d4217cb9ab26a840a853374</code>)</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Contact BambooHR Support</h3>
            <p className="text-sm">
              If you've tried all of the above and still can't connect, contact BambooHR support with:
            </p>
            <ul className="list-disc ml-6 text-sm">
              <li>Your company name</li>
              <li>Your BambooHR URL</li>
              <li>Request confirmation of your API access and company identifier</li>
              <li>Ask if there are any IP restrictions on API access</li>
            </ul>
            <p className="text-sm mt-2">
              Sometimes BambooHR requires allowlisting specific IP addresses for API access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BambooTroubleshootingDetail;
