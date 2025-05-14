
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmptyCompletionsProps {
  title: string;
  message?: string;
}

export const EmptyCompletions = ({ 
  title, 
  message = "No recent completions found"
}: EmptyCompletionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyCompletions;
