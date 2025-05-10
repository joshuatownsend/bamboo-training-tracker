
import React from 'react';
import { NavItem } from './types';
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

interface NavSectionProps {
  title?: string;
  items: NavItem[];
  isAdmin: boolean;
}

export const NavSection = ({ title, items, isAdmin }: NavSectionProps) => {
  // Filter out admin sections/items if user is not admin
  const filteredItems = items.filter(item => !item.admin || isAdmin);
  
  // Skip rendering this section if all items are filtered out
  if (filteredItems.length === 0) return null;
  
  return (
    <div className="mb-6">
      {title && (
        <h2 className="text-company-grey text-xs uppercase font-semibold tracking-wider mb-2 px-3">
          {title}
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
    </div>
  );
};

export default NavSection;
