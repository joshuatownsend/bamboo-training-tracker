
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { currentUser, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate]);

  // Show nothing while loading to prevent flash of unauthenticated content
  if (isLoading) {
    return null;
  }

  // If user is authenticated, render children
  return currentUser ? <>{children}</> : null;
};

export default AuthGuard;
