
import { BellIcon, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useMobile } from "@/hooks/useMobile";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export default function Header() {
  const { setIsMobile } = useMobile();
  const { currentUser, isAdmin, logout } = useUser();
  const [initials, setInitials] = useState("U");
  
  useEffect(() => {
    if (currentUser?.name) {
      const nameParts = currentUser.name.split(" ");
      if (nameParts.length >= 2) {
        setInitials(`${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`);
      } else if (nameParts.length === 1) {
        setInitials(nameParts[0][0] || "U");
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white border-b flex items-center justify-between px-4 py-3">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobile(false)}
          className="mr-2 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold ml-2">AVFRD Training Portal</span>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-company-yellow text-company-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            {currentUser && (
              <>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                    {isAdmin && (
                      <span className="text-xs font-medium mt-1 px-1.5 py-0.5 bg-company-yellow/20 text-company-black rounded-sm inline-block w-fit">
                        Administrator
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
