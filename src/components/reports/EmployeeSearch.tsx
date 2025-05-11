
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface EmployeeSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function EmployeeSearch({ searchQuery, setSearchQuery }: EmployeeSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search volunteers..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
