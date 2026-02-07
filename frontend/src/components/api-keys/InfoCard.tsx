'use client';

import { Card } from '@/components/ui/card';

export default function InfoCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5 bg-primary/5 border-primary/20 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">🔑</span>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Secure Authentication</h3>
            <p className="text-sm text-muted-foreground">
              API keys authenticate tracking requests from your website. Keep them secure and never expose them publicly.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-accent/5 border-accent/20 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">⚡</span>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Easy Integration</h3>
            <p className="text-sm text-muted-foreground">
              Simple setup for Next.js, React, and Vue.js. Just add the script and start tracking in minutes.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-success/5 border-success/20 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">🔒</span>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              GDPR-compliant tracking with IP anonymization. Your users&apos; privacy is protected by default.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
