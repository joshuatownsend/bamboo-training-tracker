
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getEffectiveBambooConfig, storeSubdomainLocally } from '@/lib/bamboohr/config';
import useBambooHR from '@/hooks/useBambooHR';
import { testBambooHREndpoints } from '@/lib/bamboohr/api-tester';

export interface TestResult {
  step: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
}

export const useBambooTroubleshooting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState(() => localStorage.getItem('bamboo_subdomain') || '');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  const { isConfigured, getBambooService } = useBambooHR();

  const updateSubdomain = () => {
    if (!subdomain) {
      toast({
        title: "Subdomain Required",
        description: "Please enter a subdomain to test",
        variant: "destructive"
      });
      return;
    }

    const cleanedSubdomain = subdomain.replace(/\.bamboohr\.com$/i, '');
    storeSubdomainLocally(cleanedSubdomain);
    setSubdomain(cleanedSubdomain);
    
    toast({
      title: "Subdomain Updated",
      description: `Subdomain updated to "${cleanedSubdomain}". Run the tests again to verify.`,
      duration: 3000
    });
  };

  const runApiTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const config = getEffectiveBambooConfig();
      
      if (!config.useEdgeFunction && !config.subdomain) {
        throw new Error('BambooHR configuration is missing. Please configure your API credentials or enable Edge Function.');
      }
      
      if (config.useEdgeFunction && !subdomain) {
        throw new Error('Please enter your BambooHR subdomain in the field above to run diagnostic tests. This helps with troubleshooting.');
      }
      
      const client = getBambooService();
      
      const testResults = await testBambooHREndpoints(client);
      setResults(testResults);
    } catch (error) {
      console.error('Error running API tests:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    results,
    subdomain,
    setSubdomain,
    updateSubdomain,
    runApiTests,
    testResults,
    setTestResults,
    isConfigured,
    getBambooService
  };
};

export default useBambooTroubleshooting;
