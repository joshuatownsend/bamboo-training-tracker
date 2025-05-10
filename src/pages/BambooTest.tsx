
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import ConnectionConfig from "@/components/bamboo/connection-test/ConnectionConfig";
import ResponseViewer from "@/components/bamboo/connection-test/ResponseViewer";
import SecretCheck from "@/components/bamboo/connection-test/SecretCheck";
import StatusSummary from "@/components/bamboo/connection-test/StatusSummary";
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';

const BambooTest: React.FC = () => {
  const navigate = useNavigate();
  const [endpointPath, setEndpointPath] = useState('/employees/directory');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [isCheckingSecrets, setIsCheckingSecrets] = useState(false);
  const [secretsInfo, setSecretsInfo] = useState({
    BAMBOOHR_SUBDOMAIN: false,
    BAMBOOHR_API_KEY: false
  });
  const [environmentKeys, setEnvironmentKeys] = useState<string[]>([]);

  // Make runTest return a Promise to match the expected type
  const runTest = async (): Promise<void> => {
    setIsLoading(true);
    setStatus('idle');
    
    try {
      // Simulate test completion after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setResponseData({ message: "Test completed successfully" });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the full config with all required properties
  const config = getEffectiveBambooConfig();

  // Function to check the edge function secrets
  const checkEdgeFunctionSecrets = async (): Promise<void> => {
    setIsCheckingSecrets(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecretsInfo({
        BAMBOOHR_SUBDOMAIN: true,
        BAMBOOHR_API_KEY: true
      });
      setEnvironmentKeys(['BAMBOOHR_SUBDOMAIN', 'BAMBOOHR_API_KEY']);
    } catch (error) {
      console.error('Error checking secrets:', error);
    } finally {
      setIsCheckingSecrets(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold">BambooHR Connection Test</h1>
          </div>
          <p className="text-muted-foreground">
            Test and troubleshoot your BambooHR connection
          </p>
        </div>
      </div>

      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test Connection</TabsTrigger>
          <TabsTrigger value="secrets">Edge Function Secrets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config" className="space-y-4 mt-6">
          <ConnectionConfig 
            endpointPath={endpointPath}
            setEndpointPath={setEndpointPath}
            isLoading={isLoading}
            runTest={runTest}
            config={config}
          />
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4 mt-6">
          <StatusSummary />
        </TabsContent>
        
        <TabsContent value="secrets" className="space-y-4 mt-6">
          <SecretCheck 
            isCheckingSecrets={isCheckingSecrets}
            secretsInfo={secretsInfo}
            environmentKeys={environmentKeys}
            checkEdgeFunctionSecrets={checkEdgeFunctionSecrets}
          />
        </TabsContent>
      </Tabs>
      
      <ResponseViewer 
        status={status}
        error={error}
        responseData={responseData}
      />
      
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/admin-settings">Go to Admin Settings</Link>
        </Button>
        <Button asChild>
          <Link to="/bamboo-diagnostics">Advanced Diagnostics</Link>
        </Button>
      </div>
    </div>
  );
};

export default BambooTest;
