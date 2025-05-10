
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import useBambooHR from '@/hooks/useBambooHR';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

interface TestResult {
  step: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
}

const ConnectionTests = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isConfigured, getBambooService } = useBambooHR();
  
  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Step 1: Check configuration
    const config = getEffectiveBambooConfig();
    let results: TestResult[] = [{
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
      // Fixed: Remove the argument from testConnection()
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
      
      // Step 5: Fetch all data with connection test optimization
      results = [...results, {
        step: 'Fetch All Data',
        status: 'testing',
        message: 'Attempting to fetch all data (using optimized connection test mode)...'
      }];
      setTestResults(results);
      
      try {
        // Pass true to enable connection test mode (uses smaller sample size)
        const allData = await service.fetchAllData(true);
        results[results.length - 1] = {
          step: 'Fetch All Data',
          status: 'success',
          message: `Successfully fetched all data. Employees: ${allData?.employees?.length || 0}, Trainings: ${allData?.trainings?.length || 0}, Completions: ${allData?.completions?.length || 0} (using sample)`
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
  );
};

export default ConnectionTests;
