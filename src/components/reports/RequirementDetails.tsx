
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Training } from "@/lib/types";

interface RequirementDetailsProps {
  trainings: Training[];
  isEmpty: boolean;
  type: "county" | "avfrd" | "combined";
}

export function RequirementDetails({ trainings, isEmpty, type }: RequirementDetailsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Training</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[350px]">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isEmpty ? (
              trainings.map(training => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>{training.category}</TableCell>
                  <TableCell>{training.description || "No description available"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  {type === "combined" 
                    ? "No combined requirements defined" 
                    : `No ${type === "county" ? "county" : "AVFRD"} requirements defined`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
