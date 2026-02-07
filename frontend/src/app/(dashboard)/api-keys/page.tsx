'use client';

import { useState, useEffect } from 'react';
import { getAPIKeys, createAPIKey, revokeAPIKey, getDomains } from '@/lib/api';
import type { APIKey, Domain } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

// API Keys Components
import APIKeysTable from '@/components/api-keys/APIKeysTable';
import NewKeyDisplay from '@/components/api-keys/NewKeyDisplay';
import GenerateKeyModal from '@/components/api-keys/GenerateKeyModal';
import FrameworkInstructionsModal from '@/components/api-keys/FrameworkInstructionsModal';
import InfoCard from '@/components/api-keys/InfoCard';

// Custom hook for API keys management
function useAPIKeys() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleCreateKey = async (domainIds: string[]) => {
    const { data } = await createAPIKey(domainIds);
    await loadData();
    return data.key;
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Websites using this key will stop tracking.')) {
      return;
    }

    try {
      await revokeAPIKey(id);
      await loadData();
      return true;
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      setError('Failed to revoke API key');
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    apiKeys,
    domains,
    loading,
    error,
    setError,
    handleCreateKey,
    handleRevokeKey,
  };
}

export default function APIKeysPage() {
  const {
    apiKeys,
    domains,
    loading,
    error,
    setError,
    handleCreateKey,
    handleRevokeKey,
  } = useAPIKeys();

  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [selectedKeyForInstructions, setSelectedKeyForInstructions] = useState<APIKey | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState('');

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 
    (typeof window !== 'undefined' ? window.location.origin : '');

  const getInstallCode = (apiKey: string) => {
    return `<!-- Krakens Analytics -->
<script src="${frontendUrl}/krakens.js"></script>
<script>
  Krakens.init('${apiKey}');
</script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleGenerate = async (domainIds: string[]) => {
    const key = await handleCreateKey(domainIds);
    setNewlyCreatedKey(key);
    setShowModal(false);
    toast.success('API key generated successfully!');
  };

  const handleViewInstructions = (key: APIKey) => {
    setSelectedKeyForInstructions(key);
    setShowInstructionsModal(true);
  };

  const handleRevoke = async (id: string) => {
    const success = await handleRevokeKey(id);
    if (success) {
      toast.success('API key revoked successfully');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">API Keys</h1>
          <p className="text-muted-foreground">Manage authentication keys for tracking</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn btn-primary"
          disabled={domains.length === 0}
        >
          + Generate API Key
        </button>
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Toasts */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => toast.hideToast(t.id)}
        />
      ))}

      {/* No Domains Warning */}
      {domains.length === 0 && (
        <Alert
          type="warning"
          title="No domains found"
          message="You need to add a domain before you can generate API keys. Go to the Domains page to add one."
        />
      )}

      <InfoCard />

      {/* Newly Created Key Display */}
      {newlyCreatedKey && (
        <NewKeyDisplay
          apiKey={newlyCreatedKey}
          installCode={getInstallCode(newlyCreatedKey)}
          onCopyKey={() => copyToClipboard(newlyCreatedKey)}
          onCopyCode={() => copyToClipboard(getInstallCode(newlyCreatedKey))}
          onClose={() => setNewlyCreatedKey('')}
        />
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
        <APIKeysTable
          apiKeys={apiKeys}
          domains={domains}
          onCopy={copyToClipboard}
          onViewInstructions={handleViewInstructions}
          onRevoke={handleRevoke}
        />
      )}

      {/* Modals */}
      {showModal && (
        <GenerateKeyModal
          domains={domains}
          onGenerate={handleGenerate}
          onClose={() => setShowModal(false)}
        />
      )}

      {showInstructionsModal && selectedKeyForInstructions && (
        <FrameworkInstructionsModal
          apiKey={selectedKeyForInstructions}
          frontendUrl={frontendUrl}
          onClose={() => {
            setShowInstructionsModal(false);
            setSelectedKeyForInstructions(null);
          }}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
}
