
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useUser } from "@/contexts/UserContext";
import { trainings, trainingCompletions } from "@/lib/data";
import { format } from "date-fns";
import { Search } from "lucide-react";

export default function MyTrainings() {
  const { currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get unique categories for filter
  const categories = [...new Set(trainings.map((t) => t.category))];

  // Get user's training completions if user is logged in
  const myCompletions = currentUser
    ? trainingCompletions.filter((completion) => completion.employeeId === currentUser.employeeId)
    : [];

  // Map the completions to the full training details
  const myTrainings = myCompletions.map((completion) => {
    const trainingDetails = trainings.find((t) => t.id === completion.trainingId);
    return {
      ...trainingDetails,
      completionDate: completion.completionDate,
      expirationDate: completion.expirationDate,
      status: completion.status,
      score: completion.score,
    };
  });

  // Apply filters
  const filteredTrainings = myTrainings.filter((training) => {
    if (!training) return false;
    
    const matchesSearch = training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         training.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || training.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const totalCompleted = myTrainings.filter(t => t && t.status === "completed").length;
  const totalExpired = myTrainings.filter(t => t && t.status === "expired").length;
  const totalDue = myTrainings.filter(t => t && t.status === "due").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Trainings</h1>
        <p className="text-muted-foreground">
          View and manage your training records imported from BambooHR
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompleted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalExpired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due for Renewal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{totalDue}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search trainings..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
          <CardDescription>
            These are your completed and in-progress trainings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Completion Date</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrainings.map((training, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{training?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {training?.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{training?.category}</TableCell>
                  <TableCell>
                    {training?.completionDate
                      ? format(new Date(training.completionDate), "MMM d, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {training?.expirationDate
                      ? format(new Date(training.expirationDate), "MMM d, yyyy")
                      : "No Expiration"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        training?.status === "completed"
                          ? "default"
                          : training?.status === "expired"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {training?.status === "completed"
                        ? "Completed"
                        : training?.status === "expired"
                        ? "Expired"
                        : "Due"}
                    </Badge>
                  </TableCell>
                  <TableCell>{training?.score ?? "N/A"}</TableCell>
                </TableRow>
              ))}
              {filteredTrainings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No training records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
