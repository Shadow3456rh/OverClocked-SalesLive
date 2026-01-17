import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import logo from '@/assets/saleslive-logo.png';

export const LoginPage: React.FC = () => {
  const { login, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (isLoggedIn && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        // Since we are catching errors in AuthContext, this might not trigger often,
        // but it's a good fallback
        setError('Login failed. Check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      let message = "An error occurred.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        message = "Invalid email or password.";
      } else if (err.code === 'auth/network-request-failed') {
        message = "Network error. Check your connection.";
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const prefillDemo = (role: 'owner' | 'staff') => {
    setEmail(role === 'owner' ? 'owner@demo.com' : 'staff@demo.com');
    setPassword('password123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img src={logo} alt="SalesLive" className="h-14 w-14 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to SalesLive</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-focus"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-focus"
              />
            </div>

            <Button
              type="submit"
              className="btn-billing w-full gradient-brand"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => prefillDemo('owner')}
                disabled={isLoading}
                className="h-12"
              >
                Owner Prefill
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => prefillDemo('staff')}
                disabled={isLoading}
                className="h-12"
              >
                Staff Prefill
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};