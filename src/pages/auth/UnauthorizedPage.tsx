import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_DEFINITIONS } from '@/lib/permissions';
import { DEMO_USERS } from '@/lib/mockData';

export function UnauthorizedPage() {
  const { currentRole, setDemoUser } = useAuth();
  const navigate = useNavigate();

  const roleDef = currentRole ? ROLE_DEFINITIONS[currentRole] : null;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg border-slate-200 text-center shadow-lg dark:border-slate-800">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mb-3 ring-8 ring-amber-50/50">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <Badge variant="destructive" className="mb-1 text-xs uppercase tracking-wider">
            403 - Access Denied
          </Badge>
          <CardTitle className="text-xl font-bold">Unauthorized Area</CardTitle>
          <CardDescription className="text-xs">
            Your current account does not have sufficient role permissions to view or edit this resource.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="rounded-lg bg-slate-50 p-3 text-left dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Your Active Role:</span>
              <Badge variant={roleDef?.badgeVariant || 'default'}>
                {roleDef?.name || 'Member'}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {roleDef?.description || 'Standard membership privileges.'}
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Development Role Switcher:</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Switch to an administrator or pastor role to access elevated modules:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_USERS.filter((u) => u.role === 'church_admin' || u.role === 'pastor' || u.role === 'super_admin').map((u) => (
                <Button
                  key={u.role}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setDemoUser(u);
                    navigate(-1);
                  }}
                >
                  Switch to {u.title}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
