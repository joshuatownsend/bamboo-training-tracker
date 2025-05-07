
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CheckSquare,
  FileBarChart,
  FileText,
  ListChecks,
  Settings,
  User,
  Users
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useUser();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="hidden md:flex flex-col gap-2 border-r w-64 p-4 bg-gray-50">
      <div className="flex items-center gap-2 px-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          A
        </div>
        <h2 className="text-lg font-bold">AVFRD Training</h2>
      </div>
      
      <div className="space-y-1">
        <Link to="/">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/") ? "bg-secondary/20" : "")}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>

        <p className="px-2 pt-4 pb-2 text-xs font-semibold text-muted-foreground">Personal</p>
        
        <Link to="/my-trainings">
          <Button
            variant={isActive("/my-trainings") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/my-trainings") ? "bg-secondary/20" : "")}
          >
            <FileText className="mr-2 h-4 w-4" />
            My Trainings
          </Button>
        </Link>
        
        <Link to="/my-qualifications">
          <Button
            variant={isActive("/my-qualifications") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/my-qualifications") ? "bg-secondary/20" : "")}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            My Qualifications
          </Button>
        </Link>
        
        <Link to="/required-trainings">
          <Button
            variant={isActive("/required-trainings") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/required-trainings") ? "bg-secondary/20" : "")}
          >
            <ListChecks className="mr-2 h-4 w-4" />
            Required Trainings
          </Button>
        </Link>

        <p className="px-2 pt-4 pb-2 text-xs font-semibold text-muted-foreground">Training Records</p>
        
        <Link to="/employees">
          <Button
            variant={isActive("/employees") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/employees") ? "bg-secondary/20" : "")}
          >
            <Users className="mr-2 h-4 w-4" />
            Employees
          </Button>
        </Link>
        
        <Link to="/courses">
          <Button
            variant={isActive("/courses") ? "secondary" : "ghost"}
            className={cn("w-full justify-start", isActive("/courses") ? "bg-secondary/20" : "")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Courses
          </Button>
        </Link>
        
        {isAdmin && (
          <>
            <p className="px-2 pt-4 pb-2 text-xs font-semibold text-muted-foreground">Administration</p>
            
            <Link to="/admin/reports">
              <Button
                variant={isActive("/admin/reports") ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive("/admin/reports") ? "bg-secondary/20" : "")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Admin Reports
              </Button>
            </Link>
            
            <Link to="/admin/training-impact">
              <Button
                variant={isActive("/admin/training-impact") ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive("/admin/training-impact") ? "bg-secondary/20" : "")}
              >
                <FileBarChart className="mr-2 h-4 w-4" />
                Training Impact
              </Button>
            </Link>
            
            <Link to="/admin/positions">
              <Button
                variant={isActive("/admin/positions") ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive("/admin/positions") ? "bg-secondary/20" : "")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Position Management
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
