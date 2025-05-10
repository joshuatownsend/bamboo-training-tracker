
import React from 'react';
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export const LogoHeader = () => {
  return (
    <div className="px-6 mb-4 bg-company-yellow text-black py-3">
      <Link to="/" className="flex items-center text-2xl font-bold">
        <LayoutDashboard className="mr-2 h-6 w-6" />
        Training Portal
      </Link>
    </div>
  );
};

export default LogoHeader;
