
import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { positions, trainings, trainingCompletions } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllPositionQualifications } from "@/lib/qualifications";
import { QualificationsLoadingState } from "@/components/qualifications/LoadingState";
import { QualificationsSummaryCards } from "@/components/qualifications/QualificationsSummaryCards";
import { QualificationsTable } from "@/components/qualifications/QualificationsTable";

export default function MyQualifications() {
  const { currentUser, isLoading } = useUser();
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
  
  if (isLoading) {
    return <QualificationsLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-company-black">My Qualifications</h1>
        <p className="text-muted-foreground">
          View your current position qualifications and requirements
        </p>
      </div>

      <QualificationsSummaryCards qualifications={qualifications} />

      <Tabs defaultValue="county" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="county">County Requirements</TabsTrigger>
          <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="county" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Loudoun County Position Qualifications</CardTitle>
              <CardDescription>
                Positions you qualify for based on Loudoun County requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualificationsTable qualifications={qualifications} type="county" />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avfrd" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>AVFRD Position Qualifications</CardTitle>
              <CardDescription>
                Positions you qualify for based on AVFRD requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualificationsTable qualifications={qualifications} type="avfrd" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
