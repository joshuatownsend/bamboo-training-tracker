
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MicrosoftLogo } from "@/components/icons/MicrosoftLogo";

export default function Login() {
  const { login, currentUser, isLoading } = useUser();
  const navigate = useNavigate();

  // Redirect if already authenticated
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
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
