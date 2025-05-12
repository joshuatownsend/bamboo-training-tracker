
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>;
    case 'running':
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
    case 'error':
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
    case 'never_run':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Never Run</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
