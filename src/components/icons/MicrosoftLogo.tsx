
import React from "react";

interface MicrosoftLogoProps {
  className?: string;
}

export const MicrosoftLogo: React.FC<MicrosoftLogoProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 23 23" 
      className={className} 
      fill="currentColor"
    >
      <path d="M0 0h11v11H0z" fill="#f25022"/>
      <path d="M12 0h11v11H12z" fill="#7fba00"/>
      <path d="M0 12h11v11H0z" fill="#00a4ef"/>
      <path d="M12 12h11v11H12z" fill="#ffb900"/>
    </svg>
  );
};
