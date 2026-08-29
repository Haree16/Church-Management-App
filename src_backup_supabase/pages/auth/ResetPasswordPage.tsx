import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await resetPassword(password);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } else {
      setError(result.error || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Create New Password</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your new password below.
            </CardDescription>
          </CardHeader>

          {isSuccess ? (
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-400" />
                <h4 className="text-sm font-semibold">Password updated!</h4>
                <p className="mt-1 text-xs text-slate-300">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    className="border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    className="border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                  isLoading={isLoading}
                >
                  Save New Password
                </Button>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
