
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableHeader, TableBody, TableRow, 
  TableHead, TableCell 
} from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { employees, trainings, trainingCompletions } from "@/lib/data";

export default function ComplianceReport() {
  // Calculate overall compliance statistics
  const totalEmployees = employees.length;
  const employeesWithTrainings = new Set(
    trainingCompletions.map(completion => completion.employeeId)
  ).size;
  
  const complianceRate = Math.round((employeesWithTrainings / totalEmployees) * 100);
  
  // Group employees by department
  const departments = employees.reduce((acc, employee) => {
    if (!acc[employee.department]) {
      acc[employee.department] = {
        name: employee.department,
        employees: 0,
        compliant: 0
      };
    }
    
    acc[employee.department].employees++;
    
    // Check if employee has any trainings
    const hasTrainings = trainingCompletions.some(c => c.employeeId === employee.id);
    if (hasTrainings) {
      acc[employee.department].compliant++;
    }
    
    return acc;
  }, {} as Record<string, { name: string; employees: number; compliant: number }>);
  
  // Prepare chart data
  const departmentData = Object.values(departments).map(dept => ({
    name: dept.name,
    employees: dept.employees,
    compliant: dept.compliant,
    complianceRate: Math.round((dept.compliant / dept.employees) * 100)
  }));
  
  // Prepare pie chart data
  const pieData = [
    { name: "Compliant", value: employeesWithTrainings },
    { name: "Non-Compliant", value: totalEmployees - employeesWithTrainings }
  ];
  
  const COLORS = ["#4ade80", "#f87171"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Report</h1>
        <p className="text-muted-foreground">
          View overall training compliance across the department
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Training Compliance</CardTitle>
            <CardDescription>
              Percentage of volunteers with training records in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <div className="text-sm text-muted-foreground">Overall compliance rate</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Department</CardTitle>
            <CardDescription>
              Training compliance breakdown by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Compliance Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Compliance Rate']} />
                  <Legend />
                  <Bar dataKey="complianceRate" name="Compliance Rate (%)" fill="#FCDC1D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Department Compliance Details</CardTitle>
          <CardDescription>
            Detailed breakdown of compliance by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Volunteers</TableHead>
                <TableHead className="text-right">With Training Records</TableHead>
                <TableHead className="text-right">Compliance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departmentData.map((dept, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-right">{dept.employees}</TableCell>
                  <TableCell className="text-right">{dept.compliant}</TableCell>
                  <TableCell className="text-right font-medium">
                    {dept.complianceRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
