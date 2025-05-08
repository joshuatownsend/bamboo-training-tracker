
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, ExternalLink, Server, Database } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import { BambooHRClient } from '@/lib/bamboohr/client';
import { testBambooHREndpoints } from '@/lib/bamboohr/apiTester';

const BambooTroubleshootingDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">BambooHR API Diagnostics</h1>
      
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
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {result.error && (
                                <span className="text-red-600">{result.error}</span>
                              )}
                              {result.data && (
                                <span>
                                  {result.data.isEmpty 
                                    ? "Empty response" 
                                    : `Data available (${result.data.keys.join(', ')})`}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mt-6">
                  <h3 className="font-medium text-yellow-800 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    What This Means
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    BambooHR's API structure can vary between instances based on your company's setup and subscription level.
                    These tests help identify what data is accessible with your current API key.
                    <br /><br />
                    If you're seeing errors or missing data, you may need to:
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-yellow-700">
                    <li>Generate a new API key with admin permissions</li>
                    <li>Contact BambooHR to verify your subscription includes API access</li>
                    <li>Work with us to map your specific BambooHR structure to our application</li>
                  </ul>
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
              Verify Subdomain Format
            </h3>
            <p className="text-sm">
              Make sure your subdomain is entered <strong>without</strong> ".bamboohr.com". For example,
              if your BambooHR URL is "acme.bamboohr.com", your subdomain should just be "acme".
            </p>
            <div className="bg-gray-50 p-2 rounded text-sm">
              <p>✓ Correct: <code className="bg-green-50 px-1 rounded">acme</code></p>
              <p>✗ Incorrect: <code className="bg-red-50 px-1 rounded">acme.bamboohr.com</code></p>
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
            <h3 className="font-semibold">Check API Access Permission</h3>
            <p className="text-sm">
              Not all BambooHR accounts have API access enabled. Contact your BambooHR account representative
              to verify that API access is included in your subscription and has been activated for your account.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Training & Certification Data Structure</h3>
            <p className="text-sm">
              BambooHR stores training and certification data differently depending on your setup:
            </p>
            <ul className="list-disc ml-6 text-sm">
              <li>Standard setup: Uses custom tables for training records</li>
              <li>Learning module: Uses a dedicated API structure for learning content</li>
              <li>Custom implementation: May have company-specific data structures</li>
            </ul>
            <p className="text-sm mt-2">
              The API endpoint tests above will help identify which structure your BambooHR instance uses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BambooTroubleshootingDetail;
