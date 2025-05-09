
import {
  LayoutDashboard,
  Settings,
  User,
  Book,
  AlertTriangle,
  Shield,
  FileText,
  BookCheck,
  BarChart3,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  admin?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const Sidebar = () => {
  const { currentUser: user, logout: signOut, isAdmin } = useUser();

  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "My Profile",
      items: [
        {
          name: "My Trainings",
          href: "/my-trainings",
          icon: Book,
        },
        {
          name: "My Qualifications",
          href: "/my-qualifications",
          icon: Shield,
        },
        {
          name: "Required Trainings",
          href: "/required-trainings",
          icon: FileText,
        },
      ],
    },
    {
      title: "Records",
      items: [
        {
          name: "Employees",
          href: "/employees",
          icon: Users,
        },
        {
          name: "Trainings",
          href: "/courses",
          icon: BookCheck,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          name: "Admin Reports",
          href: "/admin-reports",
          icon: BarChart3,
          admin: true,
        },
        {
          name: "Position Management",
          href: "/position-management",
          icon: Users,
          admin: true,
        },
        {
          name: "Training Requirements",
          href: "/training-requirement-management",
          icon: Book,
          admin: true,
        },
        {
          name: "Training Impact",
          href: "/training-impact",
          icon: BarChart3,
          admin: true,
        },
        {
          name: "Admin Settings",
          href: "/admin-settings",
          icon: Settings,
          admin: true,
        },
        {
          name: "BambooHR Troubleshooting",
          href: "/bamboo-troubleshooting",
          icon: AlertTriangle,
          admin: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white border-r py-4 w-64">
      <div className="px-6 mb-4 bg-company-yellow text-black py-3">
        <Link to="/" className="flex items-center text-2xl font-bold">
          <LayoutDashboard className="mr-2 h-6 w-6" />
          Training Portal
        </Link>
      </div>

      <nav className="flex-grow px-4 overflow-y-auto">
        {navigationSections.map((section, index) => {
          // Filter out admin sections/items if user is not admin
          const filteredItems = section.items.filter(item => !item.admin || isAdmin);
          
          // Skip rendering this section if all items are filtered out
          if (filteredItems.length === 0) return null;
          
          return (
            <div key={section.title || `section-${index}`} className="mb-6">
              {section.title && (
                <h2 className="text-company-grey text-xs uppercase font-semibold tracking-wider mb-2 px-3">
                  {section.title}
                </h2>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-3 py-2 text-gray-300 rounded-md hover:bg-gray-800 hover:text-company-yellow"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
              {index < navigationSections.length - 1 && filteredItems.length > 0 && (
                <Separator className="my-4 bg-gray-700" />
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-6 mt-4 pt-4 border-t border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-3 py-2 text-white hover:bg-gray-800 hover:text-company-yellow">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 bg-gray-700">
                  <AvatarFallback className="bg-gray-700 text-white">
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
