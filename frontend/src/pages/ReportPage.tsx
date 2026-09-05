import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { reportApi } from '../api';
import { useToast } from '../hooks/useToast';
import { Card, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

const reportSchema = z.object({
  short_url: z.string().min(1, 'Short link or alias is required'),
  reason: z.string().min(1, 'Please select a reason'),
  description: z.string().max(1000).optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export const ReportPage: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      short_url: '',
      reason: 'phishing',
      description: '',
    },
  });

  const onSubmit = async (values: ReportFormValues) => {
    try {
      await reportApi.submit(values);
      setIsSubmitted(true);
      reset();
      toast.success('Abuse report submitted. Thank you for keeping the web safe!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-fade-in">
      <div className="text-center mb-8 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Report Malicious or Abusive Links</h1>
        <p className="text-sm text-surface-500 max-w-lg mx-auto">
          URLForge strictly prohibits phishing, malware dissemination, spam, and illicit material. We investigate community reports promptly.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        {isSubmitted ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-foreground">Report Received</h3>
            <p className="text-xs text-surface-500 max-w-sm mx-auto">
              Our automated safety monitors and moderation team will review this link and take appropriate enforcement action.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
              Submit Another Report
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Suspicious Short URL or Alias"
              placeholder="https://urlforge.app/xyz or just xyz"
              error={errors.short_url?.message}
              {...register('short_url')}
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1.5">
                Abuse Category
              </label>
              <select
                className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('reason')}
              >
                <option value="phishing">Phishing / Credential Theft</option>
                <option value="malware">Malware / Ransomware Download</option>
                <option value="spam">Commercial Spam / Unsolicited</option>
                <option value="illegal">Illegal or Prohibited Content</option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-300 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Describe why this link is dangerous or provides deceptive content..."
                className="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-foreground placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('description')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11"
              isLoading={isSubmitting}
            >
              Submit Abuse Report
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
