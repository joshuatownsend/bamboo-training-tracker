
import { useState } from "react";

type TabValue = "county" | "avfrd" | "both";

export function useQualificationTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>("county");
  
  const isCountyTab = activeTab === "county";
  const isAVFRDTab = activeTab === "avfrd";
  const isBothTab = activeTab === "both";
  
  return {
    activeTab,
    setActiveTab,
    isCountyTab,
    isAVFRDTab,
    isBothTab
  };
}
