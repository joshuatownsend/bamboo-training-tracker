
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Position, Training } from "@/lib/types";
import { formatRequirements } from "@/utils/requirementsFormatter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PositionListProps {
  positions: Position[];
  trainings: Training[];
  onEdit: (position: Position) => void;
  onDelete: (id: string) => void;
}

export function PositionList({
  positions,
  trainings,
  onEdit,
  onDelete
}: PositionListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (positions.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No positions have been defined yet.
        <br />
        Click "Add Position" to create your first position.
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Position</TableHead>
            <TableHead className="hidden md:table-cell">Department</TableHead>
            <TableHead className="hidden lg:table-cell">Description</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className="font-medium">{position.title}</TableCell>
              <TableCell className="hidden md:table-cell">{position.department}</TableCell>
              <TableCell className="hidden lg:table-cell">{position.description}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(position)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(position.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-6 space-y-4">
        <h3 className="font-medium text-lg">Position Requirements</h3>
        
        <Accordion type="single" collapsible className="w-full">
          {positions.map((position) => (
            <AccordionItem key={position.id} value={position.id}>
              <AccordionTrigger>{position.title}</AccordionTrigger>
              <AccordionContent>
                <Tabs defaultValue="county">
                  <TabsList>
                    <TabsTrigger value="county">County Requirements</TabsTrigger>
                    <TabsTrigger value="avfrd">AVFRD Requirements</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="county" className="p-2">
                    <div className="text-sm">
                      {position.countyRequirements && (Array.isArray(position.countyRequirements) ? 
                        position.countyRequirements.length : 
                        (position.countyRequirements.requirements || []).length) > 0 ? (
                        formatRequirements(position.countyRequirements, trainings)
                      ) : (
                        <p className="text-muted-foreground italic">No county requirements specified</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="avfrd" className="p-2">
                    <div className="text-sm">
                      {position.avfrdRequirements && (Array.isArray(position.avfrdRequirements) ? 
                        position.avfrdRequirements.length : 
                        (position.avfrdRequirements.requirements || []).length) > 0 ? (
                        formatRequirements(position.avfrdRequirements, trainings)
                      ) : (
                        <p className="text-muted-foreground italic">No AVFRD requirements specified</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the position and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  onDelete(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
