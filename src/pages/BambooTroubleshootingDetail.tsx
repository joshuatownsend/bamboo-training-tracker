
import React from 'react';
import ConnectionSettings from '@/components/bamboo-troubleshooting-detail/ConnectionSettings';
import ApiEndpointExplorer from '@/components/bamboo-troubleshooting-detail/ApiEndpointExplorer';
import CommonSolutions from '@/components/bamboo-troubleshooting-detail/CommonSolutions';
import useBambooTroubleshooting from '@/hooks/useBambooTroubleshooting';

const BambooTroubleshootingDetail = () => {
  const {
    isLoading,
    error,
    results,
    subdomain,
    setSubdomain,
    updateSubdomain,
    runApiTests,
    isConfigured
  } = useBambooTroubleshooting();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">BambooHR API Diagnostics</h1>
      
      <ConnectionSettings 
        subdomain={subdomain} 
        setSubdomain={setSubdomain} 
        updateSubdomain={updateSubdomain}
        isConfigured={isConfigured}
      />
      
      <ApiEndpointExplorer 
        isLoading={isLoading} 
        error={error} 
        results={results}
        runApiTests={runApiTests}
        subdomain={subdomain}
      />
      
      <CommonSolutions />
    </div>
  );
};

export default BambooTroubleshootingDetail;
