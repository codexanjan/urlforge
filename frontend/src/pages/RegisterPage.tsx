import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LayoutDashboard, ArrowRight, ShieldCheck } from 'lucide-react';
import logoSvg from '../assets/logo.svg';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src={logoSvg} alt="URLForge" className="h-10 w-auto mx-auto text-foreground" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Open Platform Mode</h2>
          <p className="text-sm text-surface-500">
            Registration is not required. You have immediate, unlimited Administrator access.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-surface-200/80 dark:border-surface-800 space-y-6">
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <div className="text-xs text-surface-600 dark:text-surface-300">
              <span className="font-bold text-foreground block mb-1">Instant Admin Access</span>
              All features — link shortening, custom aliases, QR codes, click telemetry, and developer API keys — are ready to use.
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Launch Dashboard
          </Button>

          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-surface-500 hover:text-primary-500 font-medium transition-colors"
            >
              ← Back to Homepage
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
