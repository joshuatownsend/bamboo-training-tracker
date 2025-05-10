
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  SecretCheck, 
  ConnectionConfig, 
  ResponseViewer, 
  StatusSummary 
} from '@/components/bamboo/connection-test';
import useBambooConnectionTest from '@/hooks/bamboo/useBambooConnectionTest';

const BambooConnectionTest: React.FC = () => {
  const {
    isLoading,
    status,
    error,
    responseData,
    endpointPath,
    setEndpointPath,
    secretsInfo,
    environmentKeys,
    isCheckingSecrets,
    checkEdgeFunctionSecrets,
    runTest,
    config
  } = useBambooConnectionTest();

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
        <SecretCheck 
          isCheckingSecrets={isCheckingSecrets}
          secretsInfo={secretsInfo}
          environmentKeys={environmentKeys}
          checkEdgeFunctionSecrets={checkEdgeFunctionSecrets}
        />
      )}
      
      <ConnectionConfig
        endpointPath={endpointPath}
        setEndpointPath={setEndpointPath}
        isLoading={isLoading}
        runTest={runTest}
        config={config}
      />
      
      <ResponseViewer 
        status={status} 
        error={error} 
        responseData={responseData} 
      />
      
      <StatusSummary />
    </div>
  );
};

export default BambooConnectionTest;
