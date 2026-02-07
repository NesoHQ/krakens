'use client';

import { Card } from '@/components/ui/card';

interface NewKeyDisplayProps {
  apiKey: string;
  installCode: string;
  onCopyKey: () => void;
  onCopyCode: () => void;
  onClose: () => void;
}

export default function NewKeyDisplay({
  apiKey,
  installCode,
  onCopyKey,
  onCopyCode,
  onClose,
}: NewKeyDisplayProps) {
  return (
    <Card className="p-6 bg-gradient-to-r from-success/10 to-primary/10 border-2 border-success/30 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold mb-1">API Key Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Make sure to copy this key now - you won&apos;t be able to see it again for security reasons.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold mb-2 block">Your API Key</label>
          <div className="flex items-center space-x-2">
            <Card className="flex-1 p-4 bg-background">
              <code className="text-sm font-mono break-all">{apiKey}</code>
            </Card>
            <button
              onClick={onCopyKey}
              className="btn btn-primary whitespace-nowrap"
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">🚀</span>
            Next Steps
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
            <li>Copy your API key and store it securely</li>
            <li>Click &quot;Instructions&quot; on the key to see framework-specific setup</li>
            <li>Install the tracking code on your website</li>
            <li>Check your dashboard for real-time analytics</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
