
import React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LucideIcon } from "lucide-react";

interface ExportMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function ExportMenuItem({ icon: Icon, label, onClick }: ExportMenuItemProps) {
  return (
    <DropdownMenuItem onClick={onClick} className="cursor-pointer">
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </DropdownMenuItem>
  );
}
