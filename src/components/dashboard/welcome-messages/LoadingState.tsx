
import React from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LoadingState: React.FC = () => {
  return (
    <Card className="border-company-yellow/30 bg-yellow-50/50 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
          <span className="text-gray-500">Loading messages...</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
