
import { useState } from "react";

// Define the valid tab values
export type QualificationTabType = "county" | "avfrd" | "both";

export function useQualificationTabs() {
  const [activeTab, setActiveTab] = useState<QualificationTabType>("county");

  return { activeTab, setActiveTab };
}
