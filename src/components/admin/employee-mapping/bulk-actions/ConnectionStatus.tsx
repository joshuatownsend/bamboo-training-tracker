
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useBambooHR from '@/hooks/useBambooHR';

export interface ConnectionStatusProps {
  connectionStatus: { success: boolean; message: string } | null;
  setConnectionStatus: (status: { success: boolean; message: string } | null) => void;
}

export const ConnectionStatus = ({ connectionStatus, setConnectionStatus }: ConnectionStatusProps) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const bambooHR = useBambooHR();

  // Test BambooHR connection
  const testBambooHRConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      // Check if the BambooHR service is properly instantiated
      const isConfigured = bambooHR.isConfigured();
      
      if (!isConfigured) {
        setConnectionStatus({
          success: false,
          message: "BambooHR is not properly configured. Check API credentials in Supabase."
        });
        return;
      }
      
      // Test the actual connection
      const connected = await bambooHR.getBambooService().testConnection();
      
      if (connected) {
        setConnectionStatus({
          success: true,
          message: "Successfully connected to BambooHR API"
        });
        
        // Try to fetch a small sample of data
        try {
          const testData = await bambooHR.getBambooService().fetchAllData(true);
          if (testData) {
            setConnectionStatus({
              success: true,
              message: `Connected to BambooHR API and retrieved sample data: ${testData.employees.length} employees, ${testData.trainings.length} trainings`
            });
          }
        } catch (fetchError) {
          console.error("Error fetching test data:", fetchError);
          // Still consider it a success if we connected but couldn't fetch data
        }
      } else {
        setConnectionStatus({
          success: false,
          message: "Failed to connect to BambooHR API. Check credentials and API access."
        });
      }
    } catch (error) {
      console.error("Error testing BambooHR connection:", error);
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error while testing connection"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <>
      {connectionStatus && (
        <Alert variant={connectionStatus.success ? "default" : "destructive"} className={connectionStatus.success ? "bg-green-50 border-green-200" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{connectionStatus.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
          <AlertDescription>
            {connectionStatus.message}
          </AlertDescription>
        </Alert>
      )}
      
      <Button
        variant="outline"
        onClick={testBambooHRConnection}
        disabled={testingConnection}
        className="w-full"
      >
        {testingConnection ? "Testing..." : "Test BambooHR Connection"}
      </Button>
    </>
  );
};
