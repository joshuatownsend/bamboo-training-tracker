
import React from 'react';
import { User } from "@/lib/types";
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

interface UserMenuProps {
  user: User | null;
  signOut: () => void;
}

export const UserMenu = ({ user, signOut }: UserMenuProps) => {
  return (
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
  );
};

export default UserMenu;
