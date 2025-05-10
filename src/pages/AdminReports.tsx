
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Book, FileChartLine } from "lucide-react";
import { Link } from "react-router-dom";

const AdminReports = () => {
  const reports = [
    {
      title: "Volunteer Qualification Report",
      description: "View all volunteers qualified for specific positions",
      icon: Shield,
      path: "/admin/reports/qualifications"
    },
    {
      title: "Volunteer Eligibility Report",
      description: "View all volunteers eligible but not yet promoted",
      icon: User,
      path: "/admin/reports/eligibility"
    },
    {
      title: "Training Requirements Report",
      description: "View training requirements by position",
      icon: Book,
      path: "/admin/reports/requirements"
    },
    {
      title: "Compliance Report",
      description: "View overall training compliance across the department",
      icon: FileChartLine,
      path: "/admin/reports/compliance"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Qualification Reports</h1>
        <p className="text-muted-foreground">
          Access and generate reports for training and qualification data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report, index) => (
          <Link to={report.path} key={index}>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <report.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center p-6 text-muted-foreground">
        <p>Additional report functionality will be implemented in future updates.</p>
      </div>
    </div>
  );
};

export default AdminReports;
