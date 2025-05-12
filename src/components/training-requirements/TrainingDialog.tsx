
import React from "react";
import { Training } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrainingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingTraining: Training | null;
  updateTrainingField: (field: string, value: string | number) => void;
  onSaveTraining: () => void;
}

export function TrainingDialog({
  isOpen,
  onOpenChange,
  editingTraining,
  updateTrainingField,
  onSaveTraining
}: TrainingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {editingTraining && editingTraining.id.includes("training-") ? "Create Training" : "Edit Training"}
          </DialogTitle>
          <DialogDescription>
            Define the details for this training or certification.
          </DialogDescription>
        </DialogHeader>
        {editingTraining && (
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Training Name</Label>
              <Input
                id="title"
                value={editingTraining.title}
                onChange={(e) => updateTrainingField("title", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editingTraining.description}
                onChange={(e) => updateTrainingField("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editingTraining.category}
                  onChange={(e) => updateTrainingField("category", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="durationHours">Duration (hours)</Label>
                <Input
                  id="durationHours"
                  type="number"
                  value={editingTraining.durationHours}
                  onChange={(e) => updateTrainingField("durationHours", Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expiryYears">Expiry Period (years, 0 for no expiry)</Label>
              <Input
                id="expiryYears"
                type="number"
                value={editingTraining.expiryYears || 0}
                onChange={(e) => updateTrainingField("expiryYears", Number(e.target.value))}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSaveTraining}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
