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

export default function FrameworkInstructionsModal({
  apiKey,
  frontendUrl,
  onClose,
  onCopy,
}: FrameworkInstructionsModalProps) {
  const [activeTab, setActiveTab] = useState<Framework>('nextjs');

  const instructions = {
    nextjs: {
      title: 'Next.js Installation',
      icon: '⚡',
      steps: [
        {
          title: '1. Add the Script to your Layout',
          description: 'Add the Krakens tracking script to your root layout file',
          code: `// app/layout.tsx or pages/_app.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script 
          src="${frontendUrl}/krakens.js"
          strategy="afterInteractive"
        />
        <Script id="krakens-init" strategy="afterInteractive">
          {\`
            if (typeof Krakens !== 'undefined') {
              Krakens.init('${apiKey.key}');
            }
          \`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}`,
        },
        {
          title: '2. Verify Installation',
          description: 'Check your browser console for confirmation',
          code: `// You should see:
// ✅ Krakens Analytics initialized`,
        },
        {
          title: '3. Test Tracking',
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
        if (typeof Krakens !== 'undefined') {
          Krakens.init('${apiKey.key}');
        }
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
          {\`
            if (typeof Krakens !== 'undefined') {
              Krakens.init('${apiKey.key}');
            }
          \`}
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

// Initialize Krakens after DOM is ready
app.mount('#app');

// Wait for Krakens script to load
const initKrakens = () => {
  if (typeof window.Krakens !== 'undefined') {
    window.Krakens.init('${apiKey.key}');
  } else {
    setTimeout(initKrakens, 100);
  }
};

initKrakens();`,
        },
        {
          title: '3. Alternative: Use Vue Plugin',
          description: 'Create a Vue plugin for cleaner integration',
          code: `// src/plugins/krakens.js
export default {
  install: (app) => {
    const initKrakens = () => {
      if (typeof window.Krakens !== 'undefined') {
        window.Krakens.init('${apiKey.key}');
        console.log('✅ Krakens Analytics initialized');
      } else {
        setTimeout(initKrakens, 100);
      }
    };
    
    if (typeof window !== 'undefined') {
      initKrakens();
    }
  }
};

// In main.js
import krakensPlugin from './plugins/krakens';
app.use(krakensPlugin);`,
        },
        {
          title: '4. Verify Installation',
          description: 'Check browser console for confirmation message',
        },
      ],
    },
  };

  const currentInstructions = instructions[activeTab];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
          <div className="space-y-6">
            {currentInstructions.steps.map((step, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                {step.description && (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                )}
                {step.code && (
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{step.code}</code>
                    </pre>
                    <button
                      onClick={() => onCopy(step.code)}
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
