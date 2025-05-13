
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualificationsTabContent } from "@/components/qualifications/QualificationsTabContent";
import { QualificationsBothTabContent } from "@/components/qualifications/QualificationsBothTabContent";
import { QualificationStatus } from "@/lib/types";

interface QualificationsTabsProps {
  qualifications: QualificationStatus[];
  activeTab: "county" | "avfrd";
  setActiveTab: (value: "county" | "avfrd") => void;
}

export function QualificationsTabs({ 
  qualifications,
  activeTab,
  setActiveTab
}: QualificationsTabsProps) {
  // Filter qualifications based on qualification status
  const qualifiedCounty = qualifications.filter(q => q.isQualifiedCounty);
  const qualifiedAVFRD = qualifications.filter(q => q.isQualifiedAVFRD);
  const qualifiedBoth = qualifications.filter(q => q.isQualifiedCounty && q.isQualifiedAVFRD);

  // Handle tab change with correct typing
  const handleTabChange = (value: string) => {
    // Cast to the correct type since we're constraining to valid values
    setActiveTab(value as "county" | "avfrd");
  };

  return (
    <Tabs 
      defaultValue="county" 
      value={activeTab} 
      onValueChange={handleTabChange}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="county">Loudoun County</TabsTrigger>
        <TabsTrigger value="avfrd">AVFRD</TabsTrigger>
      </TabsList>
      
      <TabsContent value="county">
        <QualificationsTabContent
          qualifications={qualifications}
          type="county"
          title="Loudoun County Qualifications"
          description="Positions you are qualified for under Loudoun County requirements"
        />
      </TabsContent>
      
      <TabsContent value="avfrd">
        <QualificationsTabContent
          qualifications={qualifications}
          type="avfrd"
          title="AVFRD Qualifications"
          description="Positions you are qualified for under AVFRD requirements"
        />
      </TabsContent>
    </Tabs>
  );
}
