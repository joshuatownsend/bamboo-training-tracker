
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Training, Position } from "@/lib/types";
import { RequirementDetails } from "@/components/reports/RequirementDetails";

interface PositionDetailsProps {
  position: Position;
  activeTab: "county" | "avfrd";
  setActiveTab: (value: "county" | "avfrd") => void;
  requiredTrainings: {
    county: Training[];
    avfrd: Training[];
  };
}

export function PositionDetails({ 
  position, 
  activeTab, 
  setActiveTab,
  requiredTrainings
}: PositionDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{position.title}</h3>
        <p className="text-sm text-muted-foreground">{position.description || "No description available"}</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "county" | "avfrd")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="county">Loudoun County Requirements</TabsTrigger>
          <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="county" className="pt-4">
          <RequirementDetails 
            trainings={requiredTrainings.county} 
            isEmpty={requiredTrainings.county.length === 0}
            type="county" 
          />
        </TabsContent>
        
        <TabsContent value="avfrd" className="pt-4">
          <RequirementDetails 
            trainings={requiredTrainings.avfrd} 
            isEmpty={requiredTrainings.avfrd.length === 0}
            type="avfrd" 
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
