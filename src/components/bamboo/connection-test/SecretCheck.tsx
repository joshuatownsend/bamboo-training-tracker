
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, AlertTriangle, Info, Server } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SecretCheckProps {
  isCheckingSecrets: boolean;
  secretsInfo: { [key: string]: boolean };
  environmentKeys: string[];
  checkEdgeFunctionSecrets: () => Promise<void>;
}

const SecretCheck: React.FC<SecretCheckProps> = ({
  isCheckingSecrets,
  secretsInfo,
  environmentKeys,
  checkEdgeFunctionSecrets
}) => {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="mr-2 h-5 w-5 text-amber-600" />
          Edge Function Secret Check
        </CardTitle>
        <CardDescription>
          Checking if required secrets are set in the Edge Function environment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="font-medium">BAMBOOHR_SUBDOMAIN</div>
              {isCheckingSecrets ? (
                <div className="flex items-center text-gray-500">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </div>
              ) : secretsInfo.BAMBOOHR_SUBDOMAIN ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Secret is set
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Secret is missing
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="font-medium">BAMBOOHR_API_KEY</div>
              {isCheckingSecrets ? (
                <div className="flex items-center text-gray-500">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </div>
              ) : secretsInfo.BAMBOOHR_API_KEY ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Secret is set
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Secret is missing
                </div>
              )}
            </div>
          </div>
          
          {/* Debug info for environment variables */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="env-vars">
              <AccordionTrigger className="flex items-center">
                <Info className="h-4 w-4 mr-2 text-blue-600" />
                Advanced Debug Information
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-blue-50 rounded-md border border-blue-100 space-y-2 text-sm">
                  <div>
                    <h4 className="font-medium">Environment Variables:</h4>
                    <div className="bg-white p-2 rounded mt-1 font-mono text-xs overflow-auto max-h-40">
                      {environmentKeys.length > 0 ? (
                        <ul className="space-y-1">
                          {environmentKeys.map((key, idx) => (
                            <li key={idx}>{key}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No environment keys reported</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Alternative Casing Check:</h4>
                    <div className="bg-white p-2 rounded mt-1">
                      {secretsInfo.bamboohr_subdomain !== undefined && (
                        <div className="flex items-center">
                          <span className="font-mono mr-2">bamboohr_subdomain:</span>
                          {secretsInfo.bamboohr_subdomain ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" /> Found
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" /> Not found
                            </span>
                          )}
                        </div>
                      )}
                      {secretsInfo.BAMBOOHR_SUBDOMAIN_UPPER !== undefined && (
                        <div className="flex items-center">
                          <span className="font-mono mr-2">BAMBOOHR_SUBDOMAIN (uppercase):</span>
                          {secretsInfo.BAMBOOHR_SUBDOMAIN_UPPER ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" /> Found
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" /> Not found
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {!secretsInfo.BAMBOOHR_SUBDOMAIN || !secretsInfo.BAMBOOHR_API_KEY ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle>Missing Secrets</AlertTitle>
              <AlertDescription>
                <p className="mt-2">
                  One or both required secrets are missing in your Supabase Edge Function environment.
                  Please set these secrets in your Supabase project to enable BambooHR integration.
                </p>
                <div className="mt-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={checkEdgeFunctionSecrets}
                    disabled={isCheckingSecrets}
                  >
                    {isCheckingSecrets ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Again"
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-white border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>All Required Secrets Configured</AlertTitle>
              <AlertDescription>
                Both BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY are properly set in your Supabase Edge Function environment.
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-green-200 text-green-700"
                    onClick={checkEdgeFunctionSecrets}
                    disabled={isCheckingSecrets}
                  >
                    {isCheckingSecrets ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Refresh Status"
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="border-t border-gray-200 pt-4">
            <Button asChild size="sm" variant="outline" className="bg-white">
              <a 
                href="https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/settings/functions" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Manage Secrets in Supabase
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecretCheck;
