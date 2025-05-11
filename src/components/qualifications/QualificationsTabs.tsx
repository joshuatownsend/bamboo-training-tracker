
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualificationStatus } from "@/lib/types";
import { QualificationsTabContent } from "./QualificationsTabContent";
import { QualificationsBothTabContent } from "./QualificationsBothTabContent";

interface QualificationsTabsProps {
  qualifications: QualificationStatus[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export function QualificationsTabs({
  qualifications,
  activeTab,
  setActiveTab
}: QualificationsTabsProps) {
  return (
    <Tabs defaultValue="county" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="county">County Requirements</TabsTrigger>
        <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
        <TabsTrigger value="both">Both Requirements</TabsTrigger>
      </TabsList>
      
      <TabsContent value="county" className="pt-4">
        <QualificationsTabContent 
          qualifications={qualifications} 
          type="county"
          title="Loudoun County Position Qualifications"
          description="Positions you qualify for based on Loudoun County SWP 801.5 requirements"
        />
      </TabsContent>
      
      <TabsContent value="avfrd" className="pt-4">
        <QualificationsTabContent 
          qualifications={qualifications} 
          type="avfrd"
          title="AVFRD Position Qualifications"
          description="Positions you qualify for based on AVFRD requirements"
        />
      </TabsContent>
      
      <TabsContent value="both" className="pt-4">
        <QualificationsBothTabContent 
          qualifications={qualifications}
        />
      </TabsContent>
    </Tabs>
  );
}
