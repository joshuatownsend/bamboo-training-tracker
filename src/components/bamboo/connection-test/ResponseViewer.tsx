
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ResponseViewerProps {
  status: 'idle' | 'success' | 'error';
  error: string | null;
  responseData: any;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ status, error, responseData }) => {
  if (status === 'idle') {
    return null;
  }

  return (
    <Card className={status === 'success' ? 'border-green-300' : 'border-red-300'}>
      <CardHeader className={status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
        <CardTitle className="flex items-center">
          {status === 'success' ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> 
              Connection Successful
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" /> 
              Connection Failed
            </>
          )}
        </CardTitle>
        {error && <CardDescription className="text-red-700">{error}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="response">
            <AccordionTrigger>Response Data</AccordionTrigger>
            <AccordionContent>
              <div className="bg-gray-50 rounded-md p-4 font-mono text-sm overflow-x-auto">
                <pre>{JSON.stringify(responseData, null, 2)}</pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ResponseViewer;
