import {
  LayoutDashboard,
  Settings,
  User,
  Book,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
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

interface NavItem {
  name: string;
  href: string;
  icon: any;
  admin?: boolean;
}

const Sidebar = () => {
  const { user, signOut, isAdmin } = useAuth();

  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: User,
    },
    {
      name: "Trainings",
      href: "/trainings",
      icon: Book,
    },
    {
      name: "Admin Settings",
      href: "/admin",
      icon: Settings,
      admin: true,
    },
    {
      name: "BambooHR Troubleshooting",
      href: "/bamboo-troubleshooting",
      icon: AlertTriangle,
      admin: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r py-4 w-64">
      <div className="px-6 mb-8">
        <Link to="/" className="flex items-center text-2xl font-bold">
          <LayoutDashboard className="mr-2 h-6 w-6" />
          Training Portal
        </Link>
      </div>

      <nav className="flex-grow px-6">
        {navigationItems.map((item) => {
          if (item.admin && !isAdmin) {
            return null;
          }

          return (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-200 hover:text-gray-900"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
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
