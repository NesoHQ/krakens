'use client';

import { useState, useEffect } from 'react';
import { getAPIKeys, createAPIKey, revokeAPIKey, getDomains } from '@/lib/api';
import type { APIKey, Domain } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysRes, domainsRes] = await Promise.all([getAPIKeys(), getDomains()]);
      setApiKeys(keysRes.data || []);
      setDomains(domainsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setApiKeys([]);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedDomains.length === 0) {
      setError('Please select at least one domain');
      return;
    }

    try {
      const { data } = await createAPIKey(selectedDomains);
      setNewlyCreatedKey(data.key);
      setSelectedDomains([]);
      setShowModal(false);
      setSuccess('API key generated successfully! Make sure to copy it now - you won\'t be able to see it again.');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Websites using this key will stop tracking.')) return;

    try {
      await revokeAPIKey(id);
      setSuccess('API key revoked successfully');
      loadData();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      setError('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const getInstallCode = (apiKey: string) => {
    return `<!-- Krakens Analytics -->
<script src="http://localhost:3000/krakens.js"></script>
<script>
  Krakens.init('${apiKey}');
</script>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">API Keys</h1>
          <p className="text-gray-600">Manage authentication keys for tracking</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowInstallModal(true)} className="btn btn-secondary">
            📖 Installation Guide
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="btn btn-primary"
            disabled={domains.length === 0}
          >
            + Generate API Key
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* No Domains Warning */}
      {domains.length === 0 && (
        <Alert
          type="warning"
          title="No domains found"
          message="You need to add a domain before you can generate API keys. Go to the Domains page to add one."
        />
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🔑</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">What are API keys?</h3>
            <p className="text-sm text-blue-800">
              API keys authenticate tracking requests from your website. Generate a key, add it to your website&apos;s code, and start collecting analytics data. Keep your keys secure!
            </p>
          </div>
        </div>
      </div>

      {/* Newly Created Key Display */}
      {newlyCreatedKey && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-1">✅ API Key Created!</h3>
              <p className="text-sm text-green-800">
                Copy this key now - you won&apos;t be able to see it again for security reasons.
              </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey('')}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
            <code className="text-sm font-mono text-gray-900 break-all">{newlyCreatedKey}</code>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="btn btn-primary"
            >
              📋 Copy Key
            </button>
            <button
              onClick={() => {
                copyToClipboard(getInstallCode(newlyCreatedKey));
              }}
              className="btn btn-secondary"
            >
              📋 Copy Installation Code
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <EmptyState
          icon="🔑"
          title="No API keys yet"
          description="Generate your first API key to start tracking analytics on your website. You'll need to add a domain first."
          action={domains.length > 0 ? {
            label: '+ Generate Your First API Key',
            onClick: () => setShowModal(true),
          } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <code className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-mono text-gray-900 break-all flex-1">
                      {key.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.key)}
                      className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Domains:</span> {key.domain_ids.length}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={key.revoked ? 'text-red-600' : 'text-green-600'}>
                        {key.revoked ? '❌ Revoked' : '✅ Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setNewlyCreatedKey(key.key);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    📖 View Code
                  </button>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    disabled={key.revoked}
                  >
                    {key.revoked ? 'Revoked' : '🗑️ Revoke'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate API Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate API Key</h2>
            <form onSubmit={handleCreate}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Domains
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {domains.map((domain) => (
                    <label key={domain.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDomains.includes(domain.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDomains([...selectedDomains, domain.id]);
                          } else {
                            setSelectedDomains(selectedDomains.filter((id) => id !== domain.id));
                          }
                        }}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm flex-1">{domain.domain}</span>
                      {domain.verified && <span className="text-green-600 text-xs">✓</span>}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select which domains this API key can track
                </p>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Generate Key
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Installation Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Installation Guide</h2>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Generate API Key</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Click &quot;Generate API Key&quot; above and select your domain(s).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Add Tracking Code</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Add this code to your website&apos;s <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> section:
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm"><code>{`<!-- Krakens Analytics -->
<script src="http://localhost:3000/krakens.js"></script>
<script>
  Krakens.init('YOUR_API_KEY_HERE');
</script>`}</code></pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Verify Installation</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Visit your website and check the dashboard - you should see real-time visitors appear within seconds!
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>The tracking script is less than 5KB and won&apos;t slow down your site</li>
                  <li>It automatically tracks page views and navigation</li>
                  <li>Works with single-page applications (React, Vue, etc.)</li>
                  <li>Respects user privacy with IP anonymization</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowInstallModal(false)}
                className="btn btn-primary w-full"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
