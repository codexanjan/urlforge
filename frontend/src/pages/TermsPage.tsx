import React from 'react';
import { Card } from '../components/ui/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Terms of Service</h1>
        <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">
          Effective Date: September 2026
        </p>
      </div>

      <Card className="p-8 text-sm text-surface-600 dark:text-surface-300 space-y-6 leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">1. Acceptable Use Policy</h2>
          <p>
            URLForge is built for developers, businesses, and creators to share and measure authentic web destinations. You agree not to use the service for:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 text-xs text-surface-500">
            <li>Phishing, credential harvesting, or deceptive lookalike domains.</li>
            <li>Distributing malicious software, ransomware, trojans, or exploit kits.</li>
            <li>Unsolicited commercial spam or automated abusive link bombardment.</li>
            <li>Routing to unlawful material or violating copyright and trademark laws.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">2. Link Enforcement & Disablement</h2>
          <p>
            URLForge reserves the right to immediately disable, block, or delete any short URL that triggers automated safety indicators, generates valid abuse reports, or violates our terms, without prior notice.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">3. API Rate Limits & Fair Usage</h2>
          <p>
            Automated API consumption is governed by sliding window rate limits. Attempts to circumvent rate limits or overwhelm infrastructure are grounds for immediate API key revocation.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">4. Limitation of Liability</h2>
          <p>
            URLForge is provided on an "as-is" basis. We strive for 99.9% uptime and low-latency redirects, but make no warranties regarding uninterrupted availability.
          </p>
        </div>
      </Card>
    </div>
  );
};
