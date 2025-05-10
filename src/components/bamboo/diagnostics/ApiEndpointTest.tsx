
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Play } from 'lucide-react';

const ApiEndpointTest = () => {
  const [endpoint, setEndpoint] = useState('/training/record/employee/1470');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('format');
  
  const apiOptions = [
    { label: 'Training Records', endpoint: '/training/record/employee/1470' },
    { label: 'Training Completed', endpoint: '/employees/1470/tables/trainingCompleted' },
    { label: 'Certifications', endpoint: '/employees/1470/tables/certifications' },
    { label: 'Training Catalog', endpoint: '/training/catalog' },
    { label: 'Custom Report', endpoint: '/custom_reports/report?id=41' },
  ];

  const testEndpoint = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const baseUrl = `${window.location.origin}/functions/v1/bamboohr`;
      const url = `${baseUrl}${endpoint}?subdomain=avfrd`;
      
      console.log(`Testing endpoint: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>BambooHR API Endpoint Test</CardTitle>
        <CardDescription>
          Test specific BambooHR API endpoints to diagnose connection issues
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {apiOptions.map((option) => (
              <Button 
                key={option.endpoint} 
                variant="outline" 
                size="sm"
                onClick={() => setEndpoint(option.endpoint)}
                className={endpoint === option.endpoint ? "border-yellow-500 bg-yellow-50" : ""}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={endpoint} 
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/training/record/employee/1234"
              className="flex-1"
            />
            <Button 
              onClick={testEndpoint} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? 
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div> : 
                <Play className="h-4 w-4" />
              }
              Test
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!error && result && (
          <div className="rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700">API request completed successfully</p>
              </div>
            </div>
          </div>
        )}
        
        {result && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
            <TabsContent value="format" className="p-4 border rounded-md mt-2 max-h-96 overflow-auto">
              {result && typeof result === 'object' ? (
                Array.isArray(result) ? (
                  <div>
                    <p className="mb-2 text-sm font-medium">Array with {result.length} items</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {result.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-sm">
                          {JSON.stringify(item).substring(0, 100)}
                          {JSON.stringify(item).length > 100 ? '...' : ''}
                        </li>
                      ))}
                      {result.length > 5 && (
                        <li className="text-sm text-muted-foreground">
                          ...and {result.length - 5} more items
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-sm font-medium">Object with {Object.keys(result).length} keys</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.entries(result).slice(0, 10).map(([key, value]) => (
                        <li key={key} className="text-sm">
                          <span className="font-medium">{key}</span>: {JSON.stringify(value).substring(0, 50)}
                          {JSON.stringify(value).length > 50 ? '...' : ''}
                        </li>
                      ))}
                      {Object.keys(result).length > 10 && (
                        <li className="text-sm text-muted-foreground">
                          ...and {Object.keys(result).length - 10} more keys
                        </li>
                      )}
                    </ul>
                  </div>
                )
              ) : (
                <p className="text-sm">{JSON.stringify(result)}</p>
              )}
            </TabsContent>
            <TabsContent value="raw" className="p-4 border rounded-md mt-2 max-h-96 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </TabsContent>
            <TabsContent value="stats" className="p-4 border rounded-md mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm">{Array.isArray(result) ? 'Array' : typeof result}</p>
                </div>
                {Array.isArray(result) && (
                  <div>
                    <p className="text-sm font-medium">Length</p>
                    <p className="text-sm">{result.length} items</p>
                  </div>
                )}
                {result && typeof result === 'object' && !Array.isArray(result) && (
                  <div>
                    <p className="text-sm font-medium">Keys</p>
                    <p className="text-sm">{Object.keys(result).length} properties</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Size</p>
                  <p className="text-sm">{JSON.stringify(result).length} characters</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiEndpointTest;
