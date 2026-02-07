'use client';

import { Card } from '@/components/ui/card';
import type { APIKey, Domain } from '@/types';

interface APIKeysTableProps {
  apiKeys: APIKey[];
  domains: Domain[];
  onCopy: (text: string) => void;
  onViewInstructions: (key: APIKey) => void;
  onRevoke: (id: string) => void;
}

export default function APIKeysTable({
  apiKeys,
  domains,
  onCopy,
  onViewInstructions,
  onRevoke,
}: APIKeysTableProps) {
  const getDomainNames = (domainIds: string[]) => {
    return domainIds
      .map(id => domains.find(d => d.id === id)?.domain)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-semibold text-sm">API Key</th>
              <th className="text-left py-4 px-6 font-semibold text-sm">Domains</th>
              <th className="text-left py-4 px-6 font-semibold text-sm">Created</th>
              <th className="text-left py-4 px-6 font-semibold text-sm">Status</th>
              <th className="text-right py-4 px-6 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {apiKeys.map((key) => (
              <tr key={key.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center space-x-2">
                    <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                      {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 8)}
                    </code>
                    <button
                      onClick={() => onCopy(key.key)}
                      className="text-primary hover:text-primary/80 p-1.5 rounded hover:bg-primary/10 transition-colors"
                      title="Copy full key"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {key.domain_ids.map(domainId => {
                        const domain = domains.find(d => d.id === domainId);
                        return domain ? (
                          <span
                            key={domainId}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {domain.domain}
                            {domain.verified && <span className="ml-1">✓</span>}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">
                  {new Date(key.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="py-4 px-6">
                  {key.revoked ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error">
                      ❌ Revoked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      ✅ Active
                    </span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewInstructions(key)}
                      className="btn btn-secondary text-sm py-1.5 px-3"
                      disabled={key.revoked}
                    >
                      📖 Instructions
                    </button>
                    <button
                      onClick={() => onRevoke(key.id)}
                      className="text-error hover:text-error/80 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors text-sm font-medium"
                      disabled={key.revoked}
                    >
                      {key.revoked ? 'Revoked' : '🗑️ Revoke'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
