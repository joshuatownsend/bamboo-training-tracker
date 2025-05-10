
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import ConnectionConfig from "@/components/bamboo/connection-test/ConnectionConfig";
import ResponseViewer from "@/components/bamboo/connection-test/ResponseViewer";
import SecretCheck from "@/components/bamboo/connection-test/SecretCheck";
import StatusSummary from "@/components/bamboo/connection-test/StatusSummary";

const BambooTest: React.FC = () => {
  const navigate = useNavigate();

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
            endpointPath="/employees/directory"
            setEndpointPath={() => {}}
            isLoading={false}
            runTest={() => {}}
            config={{
              subdomain: localStorage.getItem('bamboo_subdomain') || '',
              useEdgeFunction: true
            }}
          />
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4 mt-6">
          <StatusSummary />
        </TabsContent>
        
        <TabsContent value="secrets" className="space-y-4 mt-6">
          <SecretCheck />
        </TabsContent>
      </Tabs>
      
      <ResponseViewer response={null} error={null} isLoading={false} />
      
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
