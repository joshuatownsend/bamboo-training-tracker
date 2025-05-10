
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MicrosoftLogo } from "@/components/icons/MicrosoftLogo";
import { Wrench } from "lucide-react";

export default function Login() {
  const { login, currentUser, isLoading } = useUser();
  const navigate = useNavigate();
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // Redirect immediately if authenticated
  useEffect(() => {
    if (currentUser && !isLoading) {
      navigate('/');
    }
  }, [currentUser, isLoading, navigate]);

  const handleLogin = async () => {
    try {
      await login();
      // The redirect will happen in the useEffect
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const navigateWithoutAuth = () => {
    // We don't need to do anything here - the AuthGuard will handle the bypass
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-company-yellow"></div>
          <p className="text-company-grey">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // If already logged in, don't render the login form at all
  if (currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20">
      <div className="mb-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-company-black">AVFRD Training Portal</h1>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Microsoft Entra ID account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <Button
            className="w-full mt-4 bg-[#2F2F2F] text-white hover:bg-[#404040]"
            onClick={handleLogin}
          >
            <MicrosoftLogo className="mr-2 h-5 w-5" />
            Sign in with Microsoft
          </Button>
          
          {isDevelopment && (
            <Button
              className="w-full mt-4 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
              variant="outline"
              onClick={navigateWithoutAuth}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Development Mode (Skip Auth)
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <p className="text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our terms of service and privacy policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
