
import { useState } from "react";

export function useQualificationTabs() {
  const [activeTab, setActiveTab] = useState("county");
  
  return {
    activeTab,
    setActiveTab
  };
}
