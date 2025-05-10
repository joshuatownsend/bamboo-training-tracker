
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { ConnectionTests, CommonIssues, EdgeFunctionConfig } from '@/components/bamboo';

const BambooTroubleshooting = () => {
  const [activeTab, setActiveTab] = useState("tests");

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
          <ConnectionTests />
          <CommonIssues />
        </TabsContent>
        
        <TabsContent value="solutions">
          <EdgeFunctionConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BambooTroubleshooting;
