
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, ExternalLink, Server, ArrowRight } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from '@/hooks/useBambooHR';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const BambooTroubleshooting = () => {
  const [testResults, setTestResults] = useState<{
    step: string;
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tests");

  const { isConfigured, getBambooService } = useBambooHR();
  
  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Step 1: Check configuration
    const config = getEffectiveBambooConfig();
    let results: any[] = [{
      step: 'Configuration Check',
      status: isConfigured ? 'success' : 'error',
      message: isConfigured 
        ? `Configuration found: subdomain=${config.subdomain}, API key present: ${Boolean(config.apiKey)}, Edge Function: ${config.useEdgeFunction ? 'Enabled' : 'Disabled'}`
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
          : 'No employees returned. Please check your BambooHR configuration.'
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">BambooHR Connection Troubleshooting</h1>
        <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black">
          <Link to="/bamboo-diagnostics">
            Advanced Diagnostics
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="tests">Connection Tests</TabsTrigger>
          <TabsTrigger value="solutions">Configuration Help</TabsTrigger>
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
                <p>Edge Function: <code>{getEffectiveBambooConfig().useEdgeFunction ? 'Enabled' : 'Disabled'}</code></p>
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
        
        <TabsContent value="solutions">
          <Card>
            <CardHeader>
              <CardTitle>Supabase Edge Function Configuration</CardTitle>
              <CardDescription>
                BambooHR API access is now managed by a Supabase Edge Function
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Edge Function Integration</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        BambooHR API access is managed by a Supabase Edge Function. This eliminates CORS issues and 
                        provides better security by keeping your BambooHR credentials on the server.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-md p-3">
                <h4 className="font-medium mb-1">How the Edge Function works:</h4>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Your browser sends an API request to the Supabase Edge Function</li>
                  <li>The Edge Function retrieves the BambooHR credentials from environment variables</li>
                  <li>The Edge Function forwards your request to BambooHR with the proper authentication</li>
                  <li>The Edge Function returns the BambooHR API response to your application</li>
                </ol>
              </div>
              
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-2">Setting Up Supabase Edge Function</h3>
                <p className="text-sm mb-4">
                  To use the BambooHR Edge Function, you need to configure the following environment variables in your Supabase project:
                </p>
                <ul className="list-disc ml-6 text-sm space-y-1">
                  <li><strong>BAMBOOHR_SUBDOMAIN</strong> - Your BambooHR company subdomain</li>
                  <li><strong>BAMBOOHR_API_KEY</strong> - Your BambooHR API key</li>
                </ul>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-4 bg-blue-100"
                  onClick={() => window.open('https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/secrets', '_blank')}
                >
                  Open Supabase Secrets Manager
                  <ExternalLink className="h-3 w-3 ml-1" />
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
