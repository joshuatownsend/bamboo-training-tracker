
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, ExternalLink, Server, Database } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

interface EndpointTestResult {
  endpoint: string;
  exists: boolean;
  responseType?: string;
  error?: string;
  data?: {
    type: string;
    title?: string;
    isLoginPage?: boolean;
    isEmpty?: boolean;
    keys?: string[];
  };
}

interface ApiTestResults {
  results: EndpointTestResult[];
  recommendations: string[];
}

interface ApiEndpointExplorerProps {
  isLoading: boolean;
  error: string | null;
  results: ApiTestResults | null;
  runApiTests: () => void;
  subdomain: string;
}

const ApiEndpointExplorer = ({ isLoading, error, results, runApiTests, subdomain }: ApiEndpointExplorerProps) => {
  return (
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
          
          {isLoading && !results && (
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
                      {results.results.map((result: EndpointTestResult, index: number) => (
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
          <p>Mode: <code>{getEffectiveBambooConfig().useEdgeFunction ? 'Edge Function' : 'Direct API'}</code></p>
          <p>Diagnostic Subdomain: <code>{subdomain || 'Not set'}</code></p>
          <p>Edge Function: <code>{getEffectiveBambooConfig().useEdgeFunction ? 'Enabled' : 'Disabled'}</code></p>
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
  );
};

export default ApiEndpointExplorer;
