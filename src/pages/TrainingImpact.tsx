
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employees, positions, trainings, trainingCompletions } from "@/lib/data";
import { simulateTrainingImpact } from "@/lib/qualifications";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileBarChart } from "lucide-react";

export default function TrainingImpact() {
  const [selectedTraining, setSelectedTraining] = useState<string>("");
  
  // Calculate impact of selected training across all positions
  const impactData = selectedTraining
    ? simulateTrainingImpact(
        selectedTraining,
        employees,
        positions,
        trainings,
        trainingCompletions
      )
    : {};
  
  // Format data for chart display
  const chartData = selectedTraining
    ? positions.map((position) => ({
        name: position.title,
        newQualifications: impactData[position.id] || 0
      }))
    : [];
  
  // Total newly qualified individuals
  const totalNewQualifications = chartData.reduce(
    (sum, item) => sum + item.newQualifications,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training Impact Analysis</h1>
        <p className="text-muted-foreground">
          Model the impact of offering a specific training on position qualifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Impact Simulator</CardTitle>
          <CardDescription>
            Select a training to see how many volunteers would become newly qualified if they completed it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select value={selectedTraining} onValueChange={setSelectedTraining}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Select a training to simulate impact" />
            </SelectTrigger>
            <SelectContent>
              {trainings.map((training) => (
                <SelectItem key={training.id} value={training.id}>
                  {training.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTraining && (
            <>
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">
                        {trainings.find(t => t.id === selectedTraining)?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {trainings.find(t => t.id === selectedTraining)?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{totalNewQualifications}</div>
                      <div className="text-xs text-muted-foreground">Total newly qualified</div>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 20,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={60} 
                          tick={{ fontSize: 12 }} 
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="newQualifications" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">New Qualifications</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.title}</TableCell>
                      <TableCell>{position.department}</TableCell>
                      <TableCell className="text-right font-medium">
                        {impactData[position.id] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </>
          )}

          {!selectedTraining && (
            <div className="text-center py-10 text-muted-foreground">
              Select a training to see its qualification impact
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
