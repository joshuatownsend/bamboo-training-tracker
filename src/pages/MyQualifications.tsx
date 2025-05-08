
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { positions, trainings, trainingCompletions } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { CheckCircle, XCircle } from "lucide-react";

export default function MyQualifications() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState("county");
  
  // Get qualification status for all positions if user is logged in
  const qualifications = currentUser
    ? getAllPositionQualifications(
        currentUser.employeeId,
        positions,
        trainings,
        trainingCompletions
      )
    : [];
  
  // Count qualified positions
  const countyQualifiedCount = qualifications.filter(q => q.isQualifiedCounty).length;
  const avfrdQualifiedCount = qualifications.filter(q => q.isQualifiedAVFRD).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Qualifications</h1>
        <p className="text-muted-foreground">
          View your current position qualifications and requirements
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">County Qualified Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countyQualifiedCount} of {positions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AVFRD Qualified Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avfrdQualifiedCount} of {positions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="county" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="county">County Requirements</TabsTrigger>
          <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="county">
          <Card>
            <CardHeader>
              <CardTitle>Loudoun County Position Qualifications</CardTitle>
              <CardDescription>
                Positions you qualify for based on Loudoun County requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Position</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Missing Requirements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifications.map((qualification) => (
                    <TableRow key={qualification.positionId}>
                      <TableCell className="font-medium">
                        {qualification.positionTitle}
                      </TableCell>
                      <TableCell>
                        {qualification.isQualifiedCounty ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            <span>Qualified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="mr-1 h-4 w-4" />
                            <span>Not Qualified</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {qualification.missingCountyTrainings.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {qualification.missingCountyTrainings.map((training) => (
                              <Badge key={training.id} variant="outline">
                                {training.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None - All requirements met
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {qualifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No qualification data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avfrd">
          <Card>
            <CardHeader>
              <CardTitle>AVFRD Position Qualifications</CardTitle>
              <CardDescription>
                Positions you qualify for based on AVFRD requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Position</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Missing Requirements</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualifications.map((qualification) => (
                    <TableRow key={qualification.positionId}>
                      <TableCell className="font-medium">
                        {qualification.positionTitle}
                      </TableCell>
                      <TableCell>
                        {qualification.isQualifiedAVFRD ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            <span>Qualified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <XCircle className="mr-1 h-4 w-4" />
                            <span>Not Qualified</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {qualification.missingAVFRDTrainings.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {qualification.missingAVFRDTrainings.map((training) => (
                              <Badge key={training.id} variant="outline">
                                {training.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            None - All requirements met
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {qualifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No qualification data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
