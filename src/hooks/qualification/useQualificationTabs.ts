
import { useState } from "react";

export function useQualificationTabs() {
  const [activeTab, setActiveTab] = useState<string>("county");

  return {
    activeTab,
    setActiveTab
  };
}
