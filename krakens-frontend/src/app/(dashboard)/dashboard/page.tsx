'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRealtimeStats, getOverviewStats, getDomains, getAPIKeys } from '@/lib/api';
import type { RealtimeStats, OverviewStats, Domain } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GettingStarted from '@/components/onboarding/GettingStarted';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';

export default function DashboardPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAPIKeys, setHasAPIKeys] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadStats();
      const interval = setInterval(() => {
        loadStats();
        setLastUpdate(new Date());
      }, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  const loadInitialData = async () => {
    try {
      const [domainsRes, keysRes] = await Promise.all([
        getDomains(),
        getAPIKeys(),
      ]);
      
      setDomains(domainsRes.data || []);
      setHasAPIKeys((keysRes.data || []).length > 0);
      
      if (domainsRes.data && domainsRes.data.length > 0) {
        setSelectedDomain(domainsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedDomain) return;

    try {
      const [realtime, overview] = await Promise.all([
        getRealtimeStats(selectedDomain),
        getOverviewStats(selectedDomain),
      ]);
      setRealtimeStats(realtime.data);
      setOverviewStats(overview.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const hasTrackedEvents = (overviewStats?.total_hits || 0) > 0;

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon="🌐"
          title="Welcome to Krakens Analytics!"
          description="Get started by adding your first domain. Once you add a domain and install the tracking code, you'll see real-time analytics here."
          action={{
            label: '+ Add Your First Domain',
            onClick: () => router.push('/domains'),
          }}
        />
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-gray-600">Track visitors, page views, and user behavior in real-time</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Privacy-First</h3>
            <p className="text-sm text-gray-600">IP anonymization and GDPR-compliant tracking</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Lightweight SDK</h3>
            <p className="text-sm text-gray-600">Less than 5KB tracking script, no impact on performance</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedDomainData = domains.find(d => d.id === selectedDomain);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights for your website traffic</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="input w-64"
          >
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.domain} {domain.verified ? '✓' : '(Unverified)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Getting Started Guide */}
      <GettingStarted
        hasDomains={domains.length > 0}
        hasAPIKeys={hasAPIKeys}
        hasTrackedEvents={hasTrackedEvents}
      />

      {/* No Data Alert */}
      {!hasTrackedEvents && (
        <Alert
          type="info"
          title="No data yet"
          message="Install the tracking code on your website to start collecting analytics. Go to API Keys to generate your tracking key."
        />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Visitors"
          value={realtimeStats?.active_visitors || 0}
          icon="👥"
          description="Currently browsing your site"
        />
        <StatCard
          title="Total Page Views"
          value={(overviewStats?.total_hits || 0).toLocaleString()}
          icon="📄"
          description="All time page views"
        />
        <StatCard
          title="Unique Visitors"
          value={(overviewStats?.unique_visitors || 0).toLocaleString()}
          icon="🎯"
          description="Last 24 hours"
        />
        <StatCard
          title="Bounce Rate"
          value={`${(overviewStats?.bounce_rate || 0).toFixed(1)}%`}
          icon="📉"
          description="Visitors who left immediately"
        />
      </div>

      {/* Traffic Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Traffic Overview</h2>
            <p className="text-sm text-gray-600">Page views per minute (last 60 minutes)</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        {(realtimeStats?.hits_per_minute?.length || 0) > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realtimeStats?.hits_per_minute || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="minute" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="hits" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>No traffic data yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Pages and Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Pages</h2>
            <span className="text-sm text-gray-500">Most visited</span>
          </div>
          {(realtimeStats?.top_pages?.length || 0) > 0 ? (
            <div className="space-y-3">
              {realtimeStats?.top_pages?.slice(0, 5).map((page, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-700 truncate font-medium">{page.path}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{page.hits}</span>
                    <span className="text-xs text-gray-500">views</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📄"
              title="No page data"
              description="Page views will appear here once you start tracking"
            />
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Referrers</h2>
            <span className="text-sm text-gray-500">Traffic sources</span>
          </div>
          {(realtimeStats?.top_referrers?.length || 0) > 0 ? (
            <div className="space-y-3">
              {realtimeStats?.top_referrers?.slice(0, 5).map((ref, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-700 truncate font-medium">
                      {ref.referrer || '🔗 Direct Traffic'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{ref.hits}</span>
                    <span className="text-xs text-gray-500">visits</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔗"
              title="No referrer data"
              description="Traffic sources will appear here once visitors arrive"
            />
          )}
        </div>
      </div>

      {/* Device, Browser, and Country Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Devices</h2>
          {Object.keys(realtimeStats?.devices || {}).length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={Object.entries(realtimeStats?.devices || {}).map(([name, value]) => ({
                      name,
                      value,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Object.entries(realtimeStats?.devices || {}).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {Object.entries(realtimeStats?.devices || {}).map(([device, count], i) => (
                  <div key={device} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-gray-700">{device}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm">No device data</p>
              </div>
            </div>
          )}
        </div>

        {/* Browsers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Browsers</h2>
          {Object.keys(realtimeStats?.browsers || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(realtimeStats?.browsers || {})
                .sort(([, a], [, b]) => b - a)
                .map(([browser, count]) => {
                  const total = Object.values(realtimeStats?.browsers || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={browser}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{browser}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-2">🌐</div>
                <p className="text-sm">No browser data</p>
              </div>
            </div>
          )}
        </div>

        {/* Countries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Countries</h2>
          {Object.keys(realtimeStats?.countries || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(realtimeStats?.countries || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([country, count]) => {
                  const total = Object.values(realtimeStats?.countries || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={country}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{country}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-2">🌍</div>
                <p className="text-sm">No location data</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Domain Info Card */}
      {selectedDomainData && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                📊 Tracking: {selectedDomainData.domain}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>• Status: {selectedDomainData.verified ? '✅ Verified' : '⏳ Pending Verification'}</p>
                <p>• Rate Limit: {selectedDomainData.settings.rate_limit} requests/min</p>
                <p>• IP Anonymization: {selectedDomainData.settings.anonymize_ip ? '✅ Enabled' : '❌ Disabled'}</p>
                <p>• Timezone: {selectedDomainData.settings.timezone}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/domains')}
              className="btn btn-secondary text-sm"
            >
              Manage Domain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
