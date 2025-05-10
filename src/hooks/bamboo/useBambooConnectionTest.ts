
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveBambooConfig } from '@/lib/bamboohr/config';
import useBambooHR from '@/hooks/useBambooHR';

export const useBambooConnectionTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [endpointPath, setEndpointPath] = useState('/employees/directory');
  const [secretsInfo, setSecretsInfo] = useState<{ [key: string]: boolean }>({
    BAMBOOHR_SUBDOMAIN: false,
    BAMBOOHR_API_KEY: false,
  });
  const [environmentKeys, setEnvironmentKeys] = useState<string[]>([]);
  const [isCheckingSecrets, setIsCheckingSecrets] = useState(false);
  
  const { toast } = useToast();
  const { getBambooService } = useBambooHR();
  
  // Get the current config
  const config = getEffectiveBambooConfig();
  
  const checkEdgeFunctionSecrets = async () => {
    setIsCheckingSecrets(true);
    
    try {
      // Create a client specifically for checking secrets
      const client = getBambooService().getClient();
      
      console.log("Checking Edge Function secrets...");
      
      const result = await client.checkEdgeFunctionSecrets();
      console.log("Secret check result:", result);
      
      if (result.secrets) {
        setSecretsInfo(result.secrets);
        
        if (result.environmentKeys) {
          setEnvironmentKeys(result.environmentKeys);
        }
        
        // Show toast with result
        if (result.secretsConfigured) {
          toast({
            title: "Secrets Verification",
            description: "BambooHR secrets are properly configured in Supabase Edge Function",
            variant: "default"
          });
        } else {
          toast({
            title: "Secrets Verification Failed",
            description: "One or more BambooHR secrets are missing in Supabase Edge Function",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Error checking Edge Function secrets:", err);
      toast({
        title: "Secret Check Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCheckingSecrets(false);
    }
  };
  
  // Check secrets when component mounts
  useEffect(() => {
    if (config.useEdgeFunction) {
      checkEdgeFunctionSecrets();
    }
  }, []);
  
  const runTest = async () => {
    setIsLoading(true);
    setStatus('idle');
    setError(null);
    setResponseData(null);
    
    try {
      const client = getBambooService().getClient();
      
      // First, test if we can get a response at all
      const response = await client.fetchRawResponse(endpointPath);
      console.log("BambooHR test response:", response.status);
      
      // Try to get the response body
      let jsonData = null;
      let textData = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          jsonData = await response.json();
          setResponseData(jsonData);
        } else {
          textData = await response.text();
          setResponseData({ text: textData });
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setResponseData({ 
          error: "Failed to parse response", 
          details: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }
      
      if (response.ok) {
        setStatus('success');
        toast({
          title: "Connection Successful",
          description: `Got HTTP ${response.status} response from BambooHR`,
          variant: "default"
        });
      } else {
        setStatus('error');
        setError(`HTTP Error ${response.status}: ${response.statusText}`);
        toast({
          title: "Connection Failed",
          description: `Got HTTP ${response.status} from BambooHR`,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("BambooHR connection test error:", err);
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
      
      toast({
        title: "Connection Test Failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    error,
    responseData,
    endpointPath,
    setEndpointPath,
    secretsInfo,
    environmentKeys,
    isCheckingSecrets,
    checkEdgeFunctionSecrets,
    runTest,
    config
  };
};

export default useBambooConnectionTest;
