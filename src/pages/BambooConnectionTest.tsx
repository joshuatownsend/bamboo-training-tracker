
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, RefreshCw, Server, ExternalLink, AlertTriangle, Info } from 'lucide-react';
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
  const [secretsInfo, setSecretsInfo] = useState<{ [key: string]: boolean }>({
    BAMBOOHR_SUBDOMAIN: false,
    BAMBOOHR_API_KEY: false,
  });
  const [environmentKeys, setEnvironmentKeys] = useState<string[]>([]);
  const [isCheckingSecrets, setIsCheckingSecrets] = useState(false);
  const { toast } = useToast();

  // Get the current config
  const config = getEffectiveBambooConfig();
  
  const checkEdgeFunctionSecrets = async () => {
    setIsCheckingSecrets(true);
    
    try {
      // Create a client specifically for checking secrets
      const client = new BambooHRClient({
        subdomain: config.subdomain,
        apiKey: config.apiKey,
        useEdgeFunction: true,
        edgeFunctionUrl: config.edgeFunctionUrl
      });
      
      console.log("Checking Edge Function secrets...");
      
      const result = await client.checkEdgeFunctionSecrets();
      console.log("Secret check result:", result);
      
      if (result.secrets) {
        setSecretsInfo(result.secrets);
        
        if (result.environmentKeys) {
          setEnvironmentKeys(result.environmentKeys);
        }
        
        // Show toast with result
        if (result.secretsConfigured) {
          toast({
            title: "Secrets Verification",
            description: "BambooHR secrets are properly configured in Supabase Edge Function",
            variant: "default"
          });
        } else {
          toast({
            title: "Secrets Verification Failed",
            description: "One or more BambooHR secrets are missing in Supabase Edge Function",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Error checking Edge Function secrets:", err);
      toast({
        title: "Secret Check Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCheckingSecrets(false);
    }
  };
  
  // Check secrets when component mounts
  useEffect(() => {
    if (config.useEdgeFunction) {
      checkEdgeFunctionSecrets();
    }
  }, []);
  
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
      
      {config.useEdgeFunction && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5 text-amber-600" />
              Edge Function Secret Check
            </CardTitle>
            <CardDescription>
              Checking if required secrets are set in the Edge Function environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="font-medium">BAMBOOHR_SUBDOMAIN</div>
                  {isCheckingSecrets ? (
                    <div className="flex items-center text-gray-500">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </div>
                  ) : secretsInfo.BAMBOOHR_SUBDOMAIN ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Secret is set
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Secret is missing
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="font-medium">BAMBOOHR_API_KEY</div>
                  {isCheckingSecrets ? (
                    <div className="flex items-center text-gray-500">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </div>
                  ) : secretsInfo.BAMBOOHR_API_KEY ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Secret is set
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Secret is missing
                    </div>
                  )}
                </div>
              </div>
              
              {/* Debug info for environment variables */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="env-vars">
                  <AccordionTrigger className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-600" />
                    Advanced Debug Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-100 space-y-2 text-sm">
                      <div>
                        <h4 className="font-medium">Environment Variables:</h4>
                        <div className="bg-white p-2 rounded mt-1 font-mono text-xs overflow-auto max-h-40">
                          {environmentKeys.length > 0 ? (
                            <ul className="space-y-1">
                              {environmentKeys.map((key, idx) => (
                                <li key={idx}>{key}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">No environment keys reported</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Alternative Casing Check:</h4>
                        <div className="bg-white p-2 rounded mt-1">
                          {secretsInfo.bamboohr_subdomain !== undefined && (
                            <div className="flex items-center">
                              <span className="font-mono mr-2">bamboohr_subdomain:</span>
                              {secretsInfo.bamboohr_subdomain ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Found
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Not found
                                </span>
                              )}
                            </div>
                          )}
                          {secretsInfo.BAMBOOHR_SUBDOMAIN_UPPER !== undefined && (
                            <div className="flex items-center">
                              <span className="font-mono mr-2">BAMBOOHR_SUBDOMAIN (uppercase):</span>
                              {secretsInfo.BAMBOOHR_SUBDOMAIN_UPPER ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Found
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Not found
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {!secretsInfo.BAMBOOHR_SUBDOMAIN || !secretsInfo.BAMBOOHR_API_KEY ? (
                <Alert className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle>Missing Secrets</AlertTitle>
                  <AlertDescription>
                    <p className="mt-2">
                      One or both required secrets are missing in your Supabase Edge Function environment.
                      Please set these secrets in your Supabase project to enable BambooHR integration.
                    </p>
                    <div className="mt-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={checkEdgeFunctionSecrets}
                        disabled={isCheckingSecrets}
                      >
                        {isCheckingSecrets ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          "Check Again"
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-white border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>All Required Secrets Configured</AlertTitle>
                  <AlertDescription>
                    Both BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY are properly set in your Supabase Edge Function environment.
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-white border-green-200 text-green-700"
                        onClick={checkEdgeFunctionSecrets}
                        disabled={isCheckingSecrets}
                      >
                        {isCheckingSecrets ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          "Refresh Status"
                        )}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="border-t border-gray-200 pt-4">
                <Button asChild size="sm" variant="outline" className="bg-white">
                  <a 
                    href="https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/settings/functions" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Manage Secrets in Supabase
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
      
      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
          <CardDescription>
            BambooHR API connection troubleshooting step-by-step guide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 list-decimal pl-6">
            <li className="pl-2">
              <h3 className="font-semibold mb-1">Edge Function Authentication</h3>
              <p className="text-sm text-gray-700">
                The Edge Function uses environment variables to authenticate with BambooHR. Ensure that both
                BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY are set in your Supabase project secrets.
              </p>
              <div className="mt-2">
                <Button asChild size="sm" variant="outline">
                  <a 
                    href="https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/bamboohr/logs" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Edge Function Logs
                  </a>
                </Button>
              </div>
            </li>
            <li className="pl-2">
              <h3 className="font-semibold mb-1">Authentication Method</h3>
              <p className="text-sm text-gray-700">
                BambooHR uses Basic Authentication where the API key is used as the username and an empty string as the password. The
                Edge Function is configured to use this authentication method automatically.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="font-semibold mb-1">CORS Configuration</h3>
              <p className="text-sm text-gray-700">
                The Edge Function includes CORS headers to allow requests from your application. If you're still seeing CORS errors, 
                check the browser console for more details.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="font-semibold mb-1">BambooHR API Access</h3>
              <p className="text-sm text-gray-700">
                Make sure your BambooHR account has API access enabled and that the API key has the necessary permissions.
              </p>
              <div className="mt-2">
                <Button asChild size="sm" variant="outline">
                  <a 
                    href="https://documentation.bamboohr.com/docs/getting-started" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BambooHR API Documentation
                  </a>
                </Button>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default BambooConnectionTest;
