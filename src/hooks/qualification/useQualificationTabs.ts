
import { useState } from 'react';

export const useQualificationTabs = () => {
  const [activeTab, setActiveTab] = useState<'county' | 'avfrd'>('county');
  
  const toggleTab = () => {
    setActiveTab(prev => prev === 'county' ? 'avfrd' : 'county');
  };
  
  return {
    activeTab,
    setActiveTab,
    toggleTab
  };
};
