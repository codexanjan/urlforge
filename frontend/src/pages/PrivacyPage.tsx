import React from 'react';
import { Card } from '../components/ui/Card';
import { Shield, Eye, Lock, Database } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold">
          Last Updated: September 2026 • Privacy-First Architecture
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Shield className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <h4 className="font-bold text-foreground text-sm">No Permanent Raw IPs</h4>
          <p className="text-xs text-surface-400 mt-1">
            Visitor IPs are salted and SHA-256 hashed immediately upon request receipt.
          </p>
        </Card>

        <Card className="p-4 text-center">
          <Eye className="w-6 h-6 text-sky-500 mx-auto mb-2" />
          <h4 className="font-bold text-foreground text-sm">Data Minimization</h4>
          <p className="text-xs text-surface-400 mt-1">
            We collect only essential client device families and referrers for telemetry.
          </p>
        </Card>

        <Card className="p-4 text-center">
          <Database className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-bold text-foreground text-sm">Total Data Control</h4>
          <p className="text-xs text-surface-400 mt-1">
            Users can export click data in JSON/CSV and permanently delete their records anytime.
          </p>
        </Card>
      </div>

      <Card className="p-8 prose dark:prose-invert max-w-none text-sm text-surface-600 dark:text-surface-300 space-y-6 leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">1. Analytics Telemetry Collection</h2>
          <p>
            When a visitor navigates through a URLForge shortened link, URLForge acts as an intermediary redirect engine. To provide link creators with aggregate engagement metrics, our system logs:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 text-xs text-surface-500">
            <li>Timestamp of the redirect</li>
            <li>HTTP Referrer header (where available)</li>
            <li>User-Agent classification (Device category, Browser name, Operating System)</li>
            <li>Geographic country signal derived from reverse proxy headers (e.g. CF-IPCountry)</li>
            <li>Bot/Crawler indicator</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">2. IP Address Handling & Anonymization</h2>
          <p>
            URLForge adheres to privacy-by-design principles. We do not commit raw visitor IP addresses to disk or relational database tables. Instead, incoming IP addresses are converted into an irreversible cryptographic hash using SHA-256 to allow link creators to observe unique visitor counts without identifying individuals.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">3. Cookies & Session Storage</h2>
          <p>
            We use local storage strictly for maintaining user interface preferences (such as dark/light theme choice) and authentication session tokens. We do not set third-party cross-site advertising trackers.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">4. Data Deletion Rights</h2>
          <p>
            Registered creators retain full ownership of their data. When you delete a link or choose "Delete Account" in settings, all related records—including link redirects, click events, API keys, and audit logs—are permanently expunged from the database.
          </p>
        </div>
      </Card>
    </div>
  );
};
