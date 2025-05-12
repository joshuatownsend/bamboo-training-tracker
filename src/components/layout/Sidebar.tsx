
import React from 'react';
import { Separator } from "@/components/ui/separator";

import { useUser } from "@/contexts/user";
import { navigationSections } from './sidebar/navigationSections';
import { NavSection } from './sidebar/NavSection';
import { UserMenu } from './sidebar/UserMenu';
import { LogoHeader } from './sidebar/LogoHeader';

const Sidebar = () => {
  const { currentUser: user, logout: signOut, isAdmin } = useUser();

  return (
    <div className="flex flex-col h-full bg-black text-white border-r py-4 w-64">
      <LogoHeader />

      <nav className="flex-grow px-4 overflow-y-auto">
        {navigationSections.map((section, index) => {
          // Render the section
          const sectionContent = (
            <NavSection 
              key={section.title || `section-${index}`}
              title={section.title} 
              items={section.items} 
              isAdmin={isAdmin} 
            />
          );
          
          // Add separator if not the last visible section
          const needsSeparator = index < navigationSections.length - 1;
          return (
            <React.Fragment key={section.title || `section-wrapper-${index}`}>
              {sectionContent}
              {needsSeparator && <Separator className="my-4 bg-gray-700" />}
            </React.Fragment>
          );
        })}
      </nav>

      <UserMenu user={user} signOut={signOut} />
    </div>
  );
};

export default Sidebar;
