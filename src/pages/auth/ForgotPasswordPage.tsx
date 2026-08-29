import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || 'Failed to send reset link.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-900/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Reset Password</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your email address and we'll send you a password reset link.
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="h-10 w-10 mb-2 text-emerald-400" />
                <h4 className="text-sm font-semibold">Check your email</h4>
                <p className="mt-1 text-xs text-slate-300">
                  We have sent password recovery instructions to <strong>{email}</strong>.
                </p>
              </div>

              <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Sign In
                </Link>
              </Button>
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
                  <label className="text-xs font-medium text-slate-300">Email Address</label>
                  <Input
                    type="email"
                    placeholder="name@church.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    className="border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </CardContent>

              <CardFooter className="border-t border-slate-800/80 pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
