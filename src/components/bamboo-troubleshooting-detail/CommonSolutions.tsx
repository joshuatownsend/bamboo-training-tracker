
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';

const CommonSolutions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Common Solutions</CardTitle>
        <CardDescription>
          Try these approaches to resolve BambooHR API connection issues
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Company ID vs. Subdomain
          </h3>
          <p className="text-sm">
            Sometimes the issue is related to the difference between your "company identifier" and your "subdomain".
            Your BambooHR URL might be something like "companyname.bamboohr.com", but the API might expect a different
            identifier (like an internal ID or abbreviated name).
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium">Try these alternatives:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Your company name exactly as it appears in BambooHR</li>
              <li>The subdomain from your BambooHR URL (before .bamboohr.com)</li>
              <li>An abbreviated version of your company name (if it's long)</li>
              <li>Contact your BambooHR administrator to confirm your company identifier</li>
            </ol>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">API Key Format and Generation</h3>
          <p className="text-sm">
            BambooHR API keys are long strings of letters and numbers. Make sure you're using a proper API key and not a password.
            Generate a new API key in BambooHR by:
          </p>
          <ol className="list-decimal ml-6 text-sm space-y-1">
            <li>Login to BambooHR as an administrator</li>
            <li>Click your avatar in the top-right</li>
            <li>Select "Account" from the dropdown</li>
            <li>Select "API Keys"</li>
            <li>Click "Add New Key"</li>
            <li>Copy the generated key (it should look like <code className="bg-gray-100 px-1 rounded">7ed5752ba65626248d4217cb9ab26a840a853374</code>)</li>
          </ol>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Contact BambooHR Support</h3>
          <p className="text-sm">
            If you've tried all of the above and still can't connect, contact BambooHR support with:
          </p>
          <ul className="list-disc ml-6 text-sm">
            <li>Your company name</li>
            <li>Your BambooHR URL</li>
            <li>Request confirmation of your API access and company identifier</li>
            <li>Ask if there are any IP restrictions on API access</li>
          </ul>
          <p className="text-sm mt-2">
            Sometimes BambooHR requires allowlisting specific IP addresses for API access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommonSolutions;
