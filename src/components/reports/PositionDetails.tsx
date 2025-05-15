
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Training, Position } from "@/lib/types";
import { RequirementDetails } from "@/components/reports/RequirementDetails";
import { ExportReportButton } from "@/components/reports/ExportReportButton";

interface PositionDetailsProps {
  position: Position;
  activeTab: "county" | "avfrd" | "combined";
  setActiveTab: (value: "county" | "avfrd" | "combined") => void;
  requiredTrainings: {
    county: Training[];
    avfrd: Training[];
    combined: Training[];
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
      <div className="flex items-center justify-between">
        <div className="pr-8"> {/* Added right padding to create margin */}
          <h3 className="text-xl font-semibold">{position.title}</h3>
          <p className="text-sm text-muted-foreground">{position.description || "No description available"}</p>
        </div>
        
        <ExportReportButton 
          position={position} 
          activeTab={activeTab} 
          trainings={requiredTrainings} 
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "county" | "avfrd" | "combined")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="county">Loudoun County Requirements</TabsTrigger>
          <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
          <TabsTrigger value="combined">Combined View</TabsTrigger>
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
        
        <TabsContent value="combined" className="pt-4">
          <RequirementDetails 
            trainings={requiredTrainings.combined} 
            isEmpty={requiredTrainings.combined.length === 0}
            type="combined" 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
