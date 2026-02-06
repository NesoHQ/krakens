'use client';

import { useState, useEffect } from 'react';
import { getDomains, createDomain, deleteDomain } from '@/lib/api';
import type { Domain } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const { data } = await getDomains();
      setDomains(data || []);
    } catch (error) {
      console.error('Failed to load domains:', error);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate domain format (allow localhost for testing)
    const domainRegex = /^([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}|localhost)$/;
    if (!domainRegex.test(newDomain)) {
      setError('Please enter a valid domain name (e.g., example.com or localhost)');
      return;
    }

    try {
      await createDomain(newDomain);
      setNewDomain('');
      setShowModal(false);
      setSuccess(`Domain "${newDomain}" added successfully!`);
      loadDomains();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create domain');
    }
  };

  const handleDelete = async (id: string, domainName: string) => {
    if (!confirm(`Are you sure you want to delete "${domainName}"? This action cannot be undone.`)) return;

    try {
      await deleteDomain(id);
      setSuccess(`Domain "${domainName}" deleted successfully`);
      loadDomains();
    } catch (error) {
      console.error('Failed to delete domain:', error);
      setError('Failed to delete domain');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Domains</h1>
          <p className="text-gray-600">Manage the websites you&apos;re tracking</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Domain
        </button>
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

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">What are domains?</h3>
            <p className="text-sm text-blue-800">
              Domains are the websites you want to track. Add your website domain here, then generate an API key to start collecting analytics data.
            </p>
          </div>
        </div>
      </div>

      {/* Domains Grid */}
      {domains.length === 0 ? (
        <EmptyState
          icon="🌐"
          title="No domains yet"
          description="Add your first domain to start tracking website analytics. You'll need to add a domain before you can generate API keys."
          action={{
            label: '+ Add Your First Domain',
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{domain.domain}</h3>
                    {domain.verified && (
                      <span className="text-green-600" title="Verified">✓</span>
                    )}
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      domain.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {domain.verified ? '✓ Verified' : '⏳ Pending Verification'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(domain.id, domain.domain)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Delete domain"
                >
                  🗑️
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span>Rate Limit:</span>
                  <span className="font-medium text-gray-900">{domain.settings.rate_limit}/min</span>
                </div>
                <div className="flex justify-between">
                  <span>IP Anonymization:</span>
                  <span className="font-medium text-gray-900">
                    {domain.settings.anonymize_ip ? '✅ On' : '❌ Off'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Timezone:</span>
                  <span className="font-medium text-gray-900">{domain.settings.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Timeout:</span>
                  <span className="font-medium text-gray-900">{domain.settings.session_timeout}s</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Added {new Date(domain.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Domain Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Domain</h2>
            <form onSubmit={handleCreate}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your domain without http:// or https:// (e.g., example.com or localhost)
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>Next steps:</strong> After adding your domain, generate an API key and install the tracking code on your website.
                </p>
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Add Domain
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
    </div>
  );
}
