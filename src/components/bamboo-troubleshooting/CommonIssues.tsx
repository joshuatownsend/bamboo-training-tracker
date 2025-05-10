
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CommonIssues = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Common Issues</CardTitle>
        <CardDescription>
          Troubleshooting steps for common BambooHR connection issues
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Incorrect Subdomain</h3>
          <p className="text-sm">
            Make sure your subdomain is entered correctly. This is the part of your BambooHR URL that comes before ".bamboohr.com".
            For example, if your BambooHR URL is "company.bamboohr.com", your subdomain is "company".
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">API Key Permissions</h3>
          <p className="text-sm">
            Ensure your API key has the necessary permissions. The API key should have read access to employee data and training records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommonIssues;
