'use client';

import { useState } from 'react';
import type { APIKey } from '@/types';

interface FrameworkInstructionsModalProps {
  apiKey: APIKey;
  frontendUrl: string;
  onClose: () => void;
  onCopy: (text: string) => void;
}

type Framework = 'nextjs' | 'react' | 'vue';

interface InstructionStep {
  title: string;
  description?: string;
  code?: string;
  important?: boolean;
}

export default function FrameworkInstructionsModal({
  apiKey,
  frontendUrl,
  onClose,
  onCopy,
}: FrameworkInstructionsModalProps) {
  const [activeTab, setActiveTab] = useState<Framework>('nextjs');

  const instructions: Record<Framework, { title: string; icon: string; steps: InstructionStep[] }> = {
    nextjs: {
      title: 'Next.js Installation',
      icon: '⚡',
      steps: [
        {
          title: '1. Add the Script to your Root Layout',
          description: '⚠️ IMPORTANT: Add the exact script below to your app/layout.tsx file. The order and structure must match exactly.',
          code: `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Krakens Analytics */}
        <Script 
          src="${frontendUrl}/krakens.js"
          strategy="afterInteractive"
        />
        <Script id="krakens-init" strategy="afterInteractive">
          {\`Krakens.init('${apiKey.key}');\`}
        </Script>
        
        {children}
      </body>
    </html>
  );
}`,
          important: true,
        },
        {
          title: '2. Alternative: Pages Directory',
          description: 'If you\'re using the pages directory, add to _app.tsx',
          code: `// pages/_app.tsx
import Script from 'next/script';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script 
        src="${frontendUrl}/krakens.js"
        strategy="afterInteractive"
      />
      <Script id="krakens-init" strategy="afterInteractive">
        {\`Krakens.init('${apiKey.key}');\`}
      </Script>
      
      <Component {...pageProps} />
    </>
  );
}`,
        },
        {
          title: '3. Verify Installation',
          description: 'Check your browser console for confirmation',
          code: `// You should see:
// ✅ Krakens Analytics initialized`,
        },
        {
          title: '4. Test Tracking',
          description: 'Navigate through your site and check the dashboard for real-time data',
        },
      ],
    },
    react: {
      title: 'React Installation',
      icon: '⚛️',
      steps: [
        {
          title: '1. Add Script to index.html',
          description: 'Add the tracking script to your public/index.html file',
          code: `<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Your App</title>
    
    <!-- Krakens Analytics -->
    <script src="${frontendUrl}/krakens.js"></script>
    <script>
      window.addEventListener('load', function() {
        Krakens.init('${apiKey.key}');
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        },
        {
          title: '2. Alternative: Use React Helmet',
          description: 'For dynamic script loading with React Helmet',
          code: `import { Helmet } from 'react-helmet';

function App() {
  return (
    <>
      <Helmet>
        <script src="${frontendUrl}/krakens.js" />
        <script>
          {\`Krakens.init('${apiKey.key}');\`}
        </script>
      </Helmet>
      {/* Your app content */}
    </>
  );
}`,
        },
        {
          title: '3. Verify Installation',
          description: 'Check browser console for confirmation message',
          code: `// You should see:
// ✅ Krakens Analytics initialized`,
        },
      ],
    },
    vue: {
      title: 'Vue.js Installation',
      icon: '💚',
      steps: [
        {
          title: '1. Add Script to index.html',
          description: 'Add the tracking script to your public/index.html file',
          code: `<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Your App</title>
    
    <!-- Krakens Analytics -->
    <script src="${frontendUrl}/krakens.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`,
        },
        {
          title: '2. Initialize in main.js',
          description: 'Initialize Krakens in your main application file',
          code: `// src/main.js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.mount('#app');

// Initialize Krakens after mount
window.addEventListener('load', () => {
  Krakens.init('${apiKey.key}');
});`,
        },
        {
          title: '3. Alternative: Use Vue Plugin',
          description: 'Create a Vue plugin for cleaner integration',
          code: `// src/plugins/krakens.js
export default {
  install: (app) => {
    window.addEventListener('load', () => {
      if (typeof window.Krakens !== 'undefined') {
        window.Krakens.init('${apiKey.key}');
        console.log('✅ Krakens Analytics initialized');
      }
    });
  }
};

// In main.js
import krakensPlugin from './plugins/krakens';
app.use(krakensPlugin);`,
        },
        {
          title: '4. Verify Installation',
          description: 'Check browser console for confirmation message',
          code: `// You should see:
// ✅ Krakens Analytics initialized`,
        },
      ],
    },
  };

  const currentInstructions = instructions[activeTab];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Installation Instructions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your framework and follow the steps below
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/30">
          <button
            onClick={() => setActiveTab('nextjs')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === 'nextjs'
                ? 'bg-background border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="mr-2">⚡</span>
            Next.js
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === 'react'
                ? 'bg-background border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="mr-2">⚛️</span>
            React
          </button>
          <button
            onClick={() => setActiveTab('vue')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              activeTab === 'vue'
                ? 'bg-background border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="mr-2">💚</span>
            Vue.js
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Important Notice for Next.js */}
          {activeTab === 'nextjs' && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-1">
                    Critical: Exact Implementation Required
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    The script in Step 1 must be implemented exactly as shown. The order, structure, and syntax are critical for proper tracking initialization.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {currentInstructions.steps.map((step, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                {step.description && (
                  <p className={`text-sm ${
                    step.description.includes('IMPORTANT') 
                      ? 'text-orange-600 dark:text-orange-400 font-semibold' 
                      : 'text-muted-foreground'
                  }`}>
                    {step.description}
                  </p>
                )}
                {step.code && (
                  <div className="relative">
                    <pre className={`p-4 rounded-lg overflow-x-auto text-sm ${
                      step.important 
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500/50' 
                        : 'bg-muted'
                    }`}>
                      <code>{step.code}</code>
                    </pre>
                    <button
                      onClick={() => onCopy(step.code || '')}
                      className="absolute top-2 right-2 p-2 rounded bg-background/80 hover:bg-background text-primary hover:text-primary/80 transition-colors"
                      title="Copy code"
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="mr-2">💡</span>
              Pro Tips
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>The tracking script is lightweight (less than 5KB)</li>
              <li>It automatically tracks page views and user interactions</li>
              <li>All data is anonymized and GDPR-compliant</li>
              <li>Check your dashboard for real-time analytics</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            Need help? Check our documentation or contact support
          </div>
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
