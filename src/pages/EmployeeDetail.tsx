
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, CalendarDays, Building, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { employees, getEmployeeTrainingStatus, trainings } from "@/lib/data";
import { format } from "date-fns";

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const employee = employees.find(e => e.id === id);
  
  if (!employee) {
    return <div>Employee not found</div>;
  }
  
  const trainingStatusData = getEmployeeTrainingStatus(employee.id);
  const initials = employee.name.split(" ").map(n => n[0]).join("");
  
  // Calculate training completion stats
  const totalTrainings = trainingStatusData?.trainingStatus.length || 0;
  const completedTrainings = trainingStatusData?.trainingStatus.filter(ts => ts.status === "completed").length || 0;
  const expiredTrainings = trainingStatusData?.trainingStatus.filter(ts => ts.status === "expired").length || 0;
  const dueTrainings = trainingStatusData?.trainingStatus.filter(ts => ts.status === "due").length || 0;
  
  const completionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
        </div>
        <Button>Update Training Records</Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Hired on {format(new Date(employee.hireDate), "MMMM d, yyyy")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Training Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm font-medium">{completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-md">
                  <div className="flex items-center text-lg font-bold">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    {completedTrainings}
                  </div>
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-md">
                  <div className="flex items-center text-lg font-bold">
                    <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                    {expiredTrainings}
                  </div>
                  <span className="text-xs text-muted-foreground">Expired</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-md">
                  <div className="flex items-center text-lg font-bold">
                    <Clock className="h-4 w-4 mr-1 text-amber-500" />
                    {dueTrainings}
                  </div>
                  <span className="text-xs text-muted-foreground">Due</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Training Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingStatusData?.trainingStatus.map((ts) => (
                <div key={ts.training.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div>
                    <h4 className="font-medium">{ts.training.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ts.training.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{ts.training.type}</Badge>
                      <Badge variant="outline">{ts.training.category}</Badge>
                      <span className="text-xs text-muted-foreground">{ts.training.durationHours} hours</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ts.status === "completed" && (
                      <>
                        <Badge variant="default" className="bg-green-500">Completed</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(ts.completionDate), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                    {ts.status === "expired" && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {ts.status === "due" && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500">Due</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDetail;
