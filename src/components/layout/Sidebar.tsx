
import {
  BarChartHorizontal,
  Briefcase,
  ClipboardCheck,
  FileBarChart,
  Home,
  ListChecks,
  Menu,
  Settings,
  User,
  X,
  Shield,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/useMobile";
import { useUser } from "@/contexts/UserContext";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, active }) => (
  <li>
    <NavLink
      to={to}
      className={`flex items-center px-3 py-2 rounded-md hover:bg-company-yellow/10 ${
        active ? "bg-company-yellow/20 font-medium" : ""
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  </li>
);

export default function Sidebar() {
  const { isMobile, setIsMobile } = useMobile();
  const location = useLocation();
  const { isAdmin } = useUser();

  return (
    <>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobile(false)}
          className="fixed top-4 left-4 z-50 bg-company-yellow/90 hover:bg-company-yellow text-black"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div
        className={`bg-black text-white flex flex-col w-64 h-screen fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out ${
          isMobile ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-company-yellow">
          <span className="text-company-black text-xl font-bold">AVFRD Training</span>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobile(true)}
              className="text-company-black hover:bg-company-yellow/80"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            <li>
              <SidebarLink
                to="/"
                active={location.pathname === "/"}
                icon={<Home className="h-4 w-4" />}
                label="Dashboard"
              />
            </li>
            <li>
              <SidebarLink
                to="/employees"
                active={location.pathname.startsWith("/employees")}
                icon={<User className="h-4 w-4" />}
                label="Employees"
              />
            </li>
            <li>
              <SidebarLink
                to="/courses"
                active={location.pathname === "/courses"}
                icon={<ListChecks className="h-4 w-4" />}
                label="Courses"
              />
            </li>
            <li className="mb-6">
              <h3 className="mb-2 text-sm text-company-grey uppercase font-medium">
                My Training
              </h3>
              <ul className="space-y-1">
                <li>
                  <SidebarLink
                    to="/my-trainings"
                    active={location.pathname === "/my-trainings"}
                    icon={<ClipboardCheck className="h-4 w-4" />}
                    label="My Trainings"
                  />
                </li>
                <li>
                  <SidebarLink
                    to="/my-qualifications"
                    active={location.pathname === "/my-qualifications"}
                    icon={<ListChecks className="h-4 w-4" />}
                    label="My Qualifications"
                  />
                </li>
                <li>
                  <SidebarLink
                    to="/required-trainings"
                    active={location.pathname === "/required-trainings"}
                    icon={<Settings className="h-4 w-4" />}
                    label="Required Trainings"
                  />
                </li>
              </ul>
            </li>
            
            {isAdmin && (
              <li className="mb-6">
                <h3 className="mb-2 text-sm text-company-grey uppercase font-medium">
                  Administration
                </h3>
                <ul className="space-y-1">
                  <SidebarLink 
                    to="/admin/reports" 
                    active={location.pathname === "/admin/reports"}
                    icon={<FileBarChart className="h-4 w-4" />} 
                    label="Reports" 
                  />
                  <SidebarLink 
                    to="/admin/positions" 
                    active={location.pathname === "/admin/positions"}
                    icon={<Briefcase className="h-4 w-4" />} 
                    label="Positions" 
                  />
                  <SidebarLink 
                    to="/admin/requirements" 
                    active={location.pathname === "/admin/requirements"}
                    icon={<ClipboardCheck className="h-4 w-4" />} 
                    label="Requirements" 
                  />
                  <SidebarLink 
                    to="/admin/training-impact" 
                    active={location.pathname === "/admin/training-impact"}
                    icon={<BarChartHorizontal className="h-4 w-4" />} 
                    label="Training Impact" 
                  />
                  <SidebarLink 
                    to="/admin/settings" 
                    active={location.pathname === "/admin/settings"}
                    icon={<Shield className="h-4 w-4" />} 
                    label="Admin Settings" 
                  />
                </ul>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
