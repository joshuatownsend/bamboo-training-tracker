
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const StatusSummary: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Summary</CardTitle>
        <CardDescription>
          BambooHR API connection troubleshooting step-by-step guide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4 list-decimal pl-6">
          <li className="pl-2">
            <h3 className="font-semibold mb-1">Edge Function Authentication</h3>
            <p className="text-sm text-gray-700">
              The Edge Function uses environment variables to authenticate with BambooHR. Ensure that both
              BAMBOOHR_SUBDOMAIN and BAMBOOHR_API_KEY are set in your Supabase project secrets.
            </p>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <a 
                  href="https://supabase.com/dashboard/project/fvpbkkmnzlxbcxokxkce/functions/bamboohr/logs" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Edge Function Logs
                </a>
              </Button>
            </div>
          </li>
          <li className="pl-2">
            <h3 className="font-semibold mb-1">Authentication Method</h3>
            <p className="text-sm text-gray-700">
              BambooHR uses Basic Authentication where the API key is used as the username and an empty string as the password. The
              Edge Function is configured to use this authentication method automatically.
            </p>
          </li>
          <li className="pl-2">
            <h3 className="font-semibold mb-1">CORS Configuration</h3>
            <p className="text-sm text-gray-700">
              The Edge Function includes CORS headers to allow requests from your application. If you're still seeing CORS errors, 
              check the browser console for more details.
            </p>
          </li>
          <li className="pl-2">
            <h3 className="font-semibold mb-1">BambooHR API Access</h3>
            <p className="text-sm text-gray-700">
              Make sure your BambooHR account has API access enabled and that the API key has the necessary permissions.
            </p>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <a 
                  href="https://documentation.bamboohr.com/docs/getting-started" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  BambooHR API Documentation
                </a>
              </Button>
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default StatusSummary;
