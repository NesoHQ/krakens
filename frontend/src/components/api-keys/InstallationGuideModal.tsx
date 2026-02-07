'use client';

import { Card } from '@/components/ui/card';

interface InstallationGuideModalProps {
  onClose: () => void;
  frontendUrl: string;
}

export default function InstallationGuideModal({ onClose, frontendUrl }: InstallationGuideModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <Card className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Installation Guide</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Step 1: Generate API Key</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Click &quot;Generate API Key&quot; above and select your domain(s).
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Step 2: Add Tracking Code</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Add this code to your website&apos;s <code className="bg-muted px-1 rounded">&lt;head&gt;</code> section:
            </p>
            <Card className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
              <pre className="text-sm"><code>{`<!-- Krakens Analytics -->
<script src="${frontendUrl}/krakens.js"></script>
<script>
  Krakens.init('YOUR_API_KEY_HERE');
</script>`}</code></pre>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Step 3: Verify Installation</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Visit your website and check the dashboard - you should see real-time visitors appear within seconds!
            </p>
          </div>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>The tracking script is less than 5KB and won&apos;t slow down your site</li>
              <li>It automatically tracks page views and navigation</li>
              <li>Works with single-page applications (React, Vue, etc.)</li>
              <li>Respects user privacy with IP anonymization</li>
            </ul>
          </Card>
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="btn btn-primary w-full">
            Got it!
          </button>
        </div>
      </Card>
    </div>
  );
}
