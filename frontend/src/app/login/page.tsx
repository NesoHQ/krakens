'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, AuthState } from '../actions/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Zap } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const initialState: AuthState = {
    success: false,
    error: null,
  };

  const [state, formAction, isPending] = useActionState(login, initialState);

  useEffect(() => {
    if (state.success && state.user) {
      // Still update Zustand for UI state (user info)
      setAuth(state.user, 'session-in-cookie');
      router.push('/dashboard');
      router.refresh();
    }
  }, [state, setAuth, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Krakens Analytics</h1>
          <p className="text-muted-foreground">Secure access to your analytics dashboard</p>
        </div>

        <Card className="shadow-lg border-border bg-card backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form action={formAction} className="space-y-4">
              {state.error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {state.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 bg-background/50"
                  disabled={isPending}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="h-11 bg-background/50 pr-10"
                    disabled={isPending}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-input"
                    disabled={isPending}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Button
                  variant="link"
                  className="text-sm p-0 h-auto"
                  disabled={isPending}
                  type="button"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isPending}
              >
                {isPending ? 'Logging in...' : 'Login to Dashboard'}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground/70">
                Protected by enterprise-grade security
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground/70">
            © 2025 Krakens Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
