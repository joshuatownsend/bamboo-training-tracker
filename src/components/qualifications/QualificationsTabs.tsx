
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualificationsTabContent } from "@/components/qualifications/QualificationsTabContent";
import { QualificationsBothTabContent } from "@/components/qualifications/QualificationsBothTabContent";
import { QualificationStatus } from "@/lib/types";

interface QualificationsTabsProps {
  qualifications: QualificationStatus[];
  activeTab: "county" | "avfrd" | "both";
  setActiveTab: (value: "county" | "avfrd" | "both") => void;
}

export function QualificationsTabs({ 
  qualifications,
  activeTab,
  setActiveTab
}: QualificationsTabsProps) {
  // Use empty array as fallback to prevent mapping errors
  const safeQualifications = qualifications || [];
  
  // Filter qualifications based on qualification status
  const qualifiedCounty = safeQualifications.filter(q => q.isQualifiedCounty);
  const qualifiedAVFRD = safeQualifications.filter(q => q.isQualifiedAVFRD);
  const qualifiedBoth = safeQualifications.filter(q => q.isQualifiedCounty && q.isQualifiedAVFRD);

  // Handle tab change with correct typing
  const handleTabChange = (value: string) => {
    // Cast to the correct type since we're constraining to valid values
    setActiveTab(value as "county" | "avfrd" | "both");
  };

  console.log("Rendering QualificationsTabs with:", {
    activeTab,
    qualificationCount: safeQualifications.length,
    qualifiedCountyCount: qualifiedCounty.length,
    qualifiedAVFRDCount: qualifiedAVFRD.length,
    qualifiedBothCount: qualifiedBoth.length
  });

  return (
    <Tabs 
      defaultValue="county" 
      value={activeTab} 
      onValueChange={handleTabChange}
    >
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="county">Loudoun County</TabsTrigger>
        <TabsTrigger value="avfrd">AVFRD</TabsTrigger>
        <TabsTrigger value="both">Both</TabsTrigger>
      </TabsList>
      
      <TabsContent value="county">
        <QualificationsTabContent
          qualifications={safeQualifications}
          type="county"
          title="Loudoun County Qualifications"
          description="Positions you are qualified for under Loudoun County requirements"
        />
      </TabsContent>
      
      <TabsContent value="avfrd">
        <QualificationsTabContent
          qualifications={safeQualifications}
          type="avfrd"
          title="AVFRD Qualifications"
          description="Positions you are qualified for under AVFRD requirements"
        />
      </TabsContent>

      <TabsContent value="both">
        <QualificationsBothTabContent
          qualifications={safeQualifications}
        />
      </TabsContent>
    </Tabs>
  );
}
