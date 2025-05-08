
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { BAMBOO_HR_CONFIG, isBambooConfigured } from '@/lib/bamboohr/config';

const BambooHRConfig: React.FC = () => {
  const [subdomain, setSubdomain] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check if BambooHR is already configured
    const configured = isBambooConfigured();
    setIsConfigured(configured);
    
    // Get values from localStorage if available
    const storedSubdomain = localStorage.getItem('bamboo_subdomain');
    const storedApiKey = localStorage.getItem('bamboo_api_key');
    
    if (storedSubdomain) setSubdomain(storedSubdomain);
    if (storedApiKey) setApiKey(storedApiKey);
    
    // If env variables are set, use those
    if (BAMBOO_HR_CONFIG.subdomain) setSubdomain(BAMBOO_HR_CONFIG.subdomain);
    if (BAMBOO_HR_CONFIG.apiKey) setApiKey(BAMBOO_HR_CONFIG.apiKey);
  }, []);

  const handleSaveConfig = async () => {
    if (!subdomain || !apiKey) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both the BambooHR subdomain and API key.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Test the connection by trying to fetch employees
      const testUrl = `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`;
      const headers = new Headers();
      const authHeader = "Basic " + btoa(`${apiKey}:`);
      headers.append("Authorization", authHeader);
      headers.append("Accept", "application/json");
      
      const response = await fetch(testUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Connection failed (${response.status}): ${await response.text()}`);
      }
      
      // Save settings to localStorage
      localStorage.setItem('bamboo_subdomain', subdomain);
      localStorage.setItem('bamboo_api_key', apiKey);
      
      toast({
        title: 'Configuration Saved',
        description: 'BambooHR connection has been successfully configured!',
      });
      
      setIsConfigured(true);
      
      // Reload the page to refresh queries with new configuration
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to BambooHR API.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConfig = () => {
    localStorage.removeItem('bamboo_subdomain');
    localStorage.removeItem('bamboo_api_key');
    setSubdomain('');
    setApiKey('');
    setIsConfigured(false);
    toast({
      title: 'Configuration Cleared',
      description: 'BambooHR connection settings have been removed.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          BambooHR Integration
        </CardTitle>
        <CardDescription>
          Connect to BambooHR to import employee data and training records.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain">BambooHR Subdomain</Label>
            <Input
              id="subdomain"
              placeholder="your-company"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This is the prefix in your BambooHR URL: https://<strong>[your-company]</strong>.bamboohr.com
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your BambooHR API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Generate an API key in BambooHR under Account → API Keys
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearConfig} disabled={isLoading || !isConfigured}>
          Clear Connection
        </Button>
        <Button onClick={handleSaveConfig} disabled={isLoading}>
          {isLoading ? 'Testing Connection...' : isConfigured ? 'Update Connection' : 'Connect to BambooHR'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BambooHRConfig;
