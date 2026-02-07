'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Alert from '@/components/ui/Alert';
import type { Domain } from '@/types';

interface GenerateKeyModalProps {
  domains: Domain[];
  onGenerate: (domainIds: string[]) => Promise<void>;
  onClose: () => void;
}

export default function GenerateKeyModal({ domains, onGenerate, onClose }: GenerateKeyModalProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedDomains.length === 0) {
      setError('Please select at least one domain');
      return;
    }

    setLoading(true);
    try {
      await onGenerate(selectedDomains);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
      style={{ margin: 0, padding: 0 }}
    >
      <Card className="m-4 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Generate API Key</h2>
        <form onSubmit={handleSubmit}>
          {error && <Alert type="error" message={error} />}
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Domains
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
              {domains.map((domain) => (
                <label
                  key={domain.id}
                  className="flex items-center p-2 hover:bg-muted/50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDomains.includes(domain.id)}
                    onChange={() => toggleDomain(domain.id)}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <span className="text-sm flex-1">{domain.domain}</span>
                  {domain.verified && <span className="text-success text-xs">✓</span>}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Select which domains this API key can track
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Key'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
