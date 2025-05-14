
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentStats } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ComplianceChartProps {
  departmentStats: DepartmentStats[];
}

export function ComplianceChart({ departmentStats = [] }: ComplianceChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Division Compliance</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis 
                dataKey="department" // Still using 'department' as the key since our model hasn't changed
                tick={{ fontSize: 12 }}
                tickLine={false}
                label={{ value: 'Division', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, "Compliance Rate"]}
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                labelFormatter={(label) => `Division: ${label}`}
              />
              <Bar 
                dataKey="complianceRate" 
                radius={[4, 4, 0, 0]}
              >
                {departmentStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.complianceRate >= 90 ? "#84cc16" : 
                          entry.complianceRate >= 70 ? "#eab308" : 
                          "#f43f5e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComplianceChart;
