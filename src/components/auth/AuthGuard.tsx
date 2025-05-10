
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { currentUser, isLoading } = useUser();
  const navigate = useNavigate();
  const [bypassAuth, setBypassAuth] = useState(false);
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Skip authentication check if we're bypassing auth in development
    if (isDevelopment && bypassAuth) {
      return;
    }

    if (!isLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, isLoading, navigate, bypassAuth, isDevelopment]);

  // Show nothing while loading to prevent flash of unauthenticated content
  if (isLoading) {
    return null;
  }

  // If in development mode and bypass is active, render children with warning
  if (isDevelopment && bypassAuth) {
    return (
      <>
        <Alert variant="destructive" className="mb-4 border-company-yellow bg-company-yellow/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Development Mode</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Authentication is currently bypassed for development. This warning will not appear in production.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setBypassAuth(false)}
              className="ml-4 border-company-black/30 hover:bg-company-yellow/20"
            >
              Enable Auth
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  // For production or when bypass is not active, only render if authenticated
  if (currentUser) {
    return <>{children}</>;
  }

  // Allow bypassing auth in development mode if not authenticated
  if (isDevelopment && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg border">
          <h2 className="text-2xl font-bold mb-4 text-company-black">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be authenticated to view this page. Since you're in development mode,
            you can bypass authentication for troubleshooting.
          </p>
          <div className="flex space-x-4">
            <Button 
              onClick={() => navigate("/login")} 
              className="w-1/2"
            >
              Log In
            </Button>
            <Button 
              onClick={() => setBypassAuth(true)} 
              variant="outline"
              className="w-1/2 border-company-yellow text-company-black hover:bg-company-yellow/10"
            >
              Bypass Auth (Dev Only)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthGuard;
