import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Building2, User, ChevronLeft } from 'lucide-react';
import logo from '@/assets/saleslive-logo.png';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
  </svg>
);

type LoginRole = 'owner' | 'staff' | null;

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedRole, setSelectedRole] = useState<LoginRole>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (isLoggedIn && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    if (!selectedRole) return;

    setError('');
    setIsLoading(true);

    try {
      // The logic for Creating the Shop is now handled inside this function in AuthContext
      const success = await loginWithGoogle(selectedRole);
      
      if (success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      
      let message = 'An error occurred during authentication.';
      
      if (err.message && err.message.includes("Access Denied")) {
        message = err.message;
      } 
      else if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }

      setError(message);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setSelectedRole(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg transition-all duration-300">
        <CardHeader className="text-center relative">
          {selectedRole && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img src={logo} alt="SalesLive" className="h-14 w-14 object-contain" />
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {selectedRole ? `${selectedRole === 'owner' ? 'Owner' : 'Staff'} Login` : 'Welcome to SalesLive'}
          </CardTitle>
          <CardDescription>
            {selectedRole ? 'Continue securely with Google' : 'Select your access level'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!selectedRole && (
            <div className="grid gap-4 py-2">
              <button
                onClick={() => setSelectedRole('owner')}
                className="group flex items-center justify-between rounded-xl border border-muted bg-card p-4 hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Business Owner</h3>
                    <p className="text-sm text-muted-foreground">Admin dashboard access</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('staff')}
                className="group flex items-center justify-between rounded-xl border border-muted bg-card p-4 hover:border-primary hover:bg-muted/50 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Staff Member</h3>
                    <p className="text-sm text-muted-foreground">POS & Orders access</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {selectedRole && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Please sign in using your registered <strong>{selectedRole}</strong> Google account.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <GoogleIcon />
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};