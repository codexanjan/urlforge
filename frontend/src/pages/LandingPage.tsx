import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { QrModal } from '../components/links/QrModal';
import { ShareModal } from '../components/links/ShareModal';
import { urlApi } from '../api';
import { URLItem } from '../types';
import { useToast } from '../hooks/useToast';
import {
  Link2,
  Sparkles,
  BarChart3,
  QrCode,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { GithubIcon } from '../components/ui/GithubIcon';

const publicShortenSchema = z.object({
  url: z.string().min(1, 'Please enter a URL').url('Enter a valid URL (e.g. https://example.com)'),
  custom_alias: z
    .string()
    .optional()
    .refine((val) => !val || (val.length >= 3 && val.length <= 32 && /^[a-zA-Z0-9_-]+$/.test(val)), {
      message: 'Alias must be 3-32 characters, letters, numbers, or hyphens',
    }),
});

type PublicShortenValues = z.infer<typeof publicShortenSchema>;

export const LandingPage: React.FC = () => {
  const { toast } = useToast();
  const [createdUrl, setCreatedUrl] = useState<URLItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PublicShortenValues>({
    resolver: zodResolver(publicShortenSchema),
  });

  const onSubmit = async (values: PublicShortenValues) => {
    try {
      const result = await urlApi.create({
        original_url: values.url,
        custom_alias: values.custom_alias ? values.custom_alias.trim() : undefined,
      });
      setCreatedUrl(result);
      toast.success('Short link generated successfully!', 'Success');
    } catch (err: any) {
      toast.error(err.message || 'Could not shorten link', 'Error');
    }
  };

  const handleCopy = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl.short_url);
      setCopied(true);
      toast.success('Copied short link to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready URL Shortener & Analytics</span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1] mb-6">
          Turn long URLs into{' '}
          <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-sky-400 bg-clip-text text-transparent">
            powerful short links.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mb-10 leading-relaxed">
          Create, manage, track, and share short URLs with real-time privacy-first analytics, custom aliases, QR codes, and developer API keys.
        </p>

        {/* Functional Shortening Box */}
        <div id="shorten" className="w-full max-w-3xl mb-12">
          <Card className="p-3 sm:p-4 shadow-xl border-surface-300/80 dark:border-surface-800 bg-card/95 backdrop-blur-md">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="relative flex items-center">
                  <Link2 className="absolute left-3.5 w-5 h-5 text-surface-400 pointer-events-none" />
                  <input
                    type="url"
                    placeholder="Paste long link here (e.g. https://example.com/very/long/path)..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm text-foreground placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    {...register('url')}
                  />
                </div>
                {errors.url && (
                  <p className="text-xs text-rose-500 font-medium text-left pl-2">{errors.url.message}</p>
                )}
              </div>

              <div className="w-full sm:w-44 flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Custom alias"
                  className="w-full px-3 py-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-sm text-foreground placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('custom_alias')}
                />
                {errors.custom_alias && (
                  <p className="text-xs text-rose-500 font-medium text-left pl-2">{errors.custom_alias.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="h-12 px-6 shrink-0"
              >
                Shorten URL
              </Button>
            </form>

            {/* Generated Link Result Preview */}
            {createdUrl && (
              <div className="mt-4 p-4 rounded-xl border border-primary-500/30 bg-primary-50/50 dark:bg-primary-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up text-left">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                    Your Short Link
                  </div>
                  <div className="font-mono text-base font-bold text-foreground truncate">
                    {createdUrl.short_url}
                  </div>
                  <div className="text-xs text-surface-400 truncate mt-0.5">
                    Destination: {createdUrl.original_url}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleCopy}
                    leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsQrOpen(true)}
                    leftIcon={<QrCode className="w-4 h-4" />}
                  >
                    QR
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsShareOpen(true)}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Share
                  </Button>

                  <a
                    href={createdUrl.short_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-surface-300 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300"
                    title="Open short link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Launch Dashboard
            </Button>
          </Link>
          <a href="https://github.com/codexanjan/urlforge" target="_blank" rel="noreferrer">
            <Button size="lg" variant="secondary" leftIcon={<GithubIcon className="w-4 h-4" />}>
              View on GitHub
            </Button>
          </a>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full py-20 bg-surface-100/50 dark:bg-surface-950/40 border-y border-surface-200/80 dark:border-surface-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-2">Platform Capabilities</h2>
            <p className="text-3xl font-extrabold text-foreground">Everything you need to scale short links</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6" hover>
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Smart Privacy Analytics</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                Track click timelines, device breakdowns, browsers, OS, referrers, and locations with privacy-first salted IP hashing.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Instant QR Generator</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                Every short link generates high-resolution vector SVG and PNG QR codes with customizable error correction levels.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Total Link Control</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                Custom aliases, temporary expiration dates, instant enable/disable toggles, bot detection, and automated abuse filters.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical FAQ */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Card className="p-5">
            <h4 className="font-bold text-foreground mb-1">How does collision-resistant short code generation work?</h4>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              URLForge utilizes Base62 pseudo-random token generation with 3.52 trillion combinations and automated database retry logic.
            </p>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-foreground mb-1">How does URLForge protect visitor privacy?</h4>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              We never permanently store raw IP addresses. IP addresses are hashed immediately using SHA-256 for unique visitor counting and abuse protection.
            </p>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-foreground mb-1">Can I automate link creation via API?</h4>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              Yes. Developers can generate scoped API keys (`uf_live_...`) to programmatically create, manage, and inspect links through standard REST endpoints.
            </p>
          </Card>
        </div>
      </section>

      {/* Modals */}
      <QrModal url={createdUrl} isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
      <ShareModal
        url={createdUrl}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onOpenQr={() => setIsQrOpen(true)}
      />
    </div>
  );
};
