'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUnifiedStats, getDomains, getAPIKeys } from '../../actions/data';
import type { RealtimeStats, OverviewStats, Domain } from '@/types';
import GettingStarted from '@/components/onboarding/GettingStarted';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import { Card } from '@/components/ui/card';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import MetricsCards from '@/components/dashboard/MetricsCards';
import TrafficChart from '@/components/dashboard/TrafficChart';
import TopPages from '@/components/dashboard/TopPages';
import TopReferrers from '@/components/dashboard/TopReferrers';
import DeviceStats from '@/components/dashboard/DeviceStats';
import BrowserStats from '@/components/dashboard/BrowserStats';
import CountryStats from '@/components/dashboard/CountryStats';
import DomainInfoCard from '@/components/dashboard/DomainInfoCard';

// Custom hook for dashboard data management
function useDashboardData() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [period, setPeriod] = useState<string>('60m');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAPIKeys, setHasAPIKeys] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadInitialData = async () => {
    try {
      const [domainsRes, keysRes] = await Promise.all([
        getDomains(),
        getAPIKeys(),
      ]);

      if (domainsRes.success) {
        setDomains(domainsRes.data || []);
        if (domainsRes.data && domainsRes.data.length > 0) {
          setSelectedDomain(domainsRes.data[0].id);
        }
      }

      if (keysRes.success) {
        setHasAPIKeys((keysRes.data || []).length > 0);
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
      const result = await getUnifiedStats(selectedDomain, period);

      if (result.success && result.data) {
        let { realtime, overview } = result.data;

        // Convert UTC times to local timezone
        if (realtime.hits_per_minute) {
          realtime.hits_per_minute = realtime.hits_per_minute.map((item: any) => {
            // For periods other than 60m, the format might be different
            if (period === '60m') {
              const [hours, minutes] = item.minute.split(':');
              const utcDate = new Date();
              utcDate.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

              const localTime = utcDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });

              return { ...item, minute: localTime };
            }

            if (period === '24h') {
              // Format: YYYY-MM-DD HH:00 (UTC)
              const utcDate = new Date(item.minute.replace(' ', 'T') + ':00Z');
              const localTime = utcDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              return { ...item, minute: localTime };
            }

            if (period === '7d' || period === '30d') {
              // Format: YYYY-MM-DD (UTC)
              const utcDate = new Date(item.minute + 'T00:00:00Z');
              const localTime = utcDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
              return { ...item, minute: localTime };
            }

            return item;
          });
        }

        setRealtimeStats(realtime);
        setOverviewStats(overview);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };


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
  }, [selectedDomain, period]);

  return {
    domains,
    selectedDomain,
    setSelectedDomain,
    period,
    setPeriod,
    realtimeStats,
    overviewStats,
    loading,
    hasAPIKeys,
    lastUpdate,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    domains,
    selectedDomain,
    setSelectedDomain,
    period,
    setPeriod,
    realtimeStats,
    overviewStats,
    loading,
    hasAPIKeys,
    lastUpdate,
  } = useDashboardData();

  const hasTrackedEvents = (overviewStats?.total_hits || 0) > 0;
  const selectedDomainData = domains.find(d => d.id === selectedDomain);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your analytics...</p>
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
          <Card className="text-center p-6 bg-primary/5">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-muted-foreground">Track visitors, page views, and user behavior in real-time</p>
          </Card>
          <Card className="text-center p-6 bg-accent/5">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">Privacy-First</h3>
            <p className="text-sm text-muted-foreground">IP anonymization and GDPR-compliant tracking</p>
          </Card>
          <Card className="text-center p-6 bg-success/5">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">Lightweight SDK</h3>
            <p className="text-sm text-muted-foreground">Less than 5KB tracking script, no impact on performance</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        lastUpdate={lastUpdate}
        domains={domains}
        selectedDomain={selectedDomain}
        onDomainChange={setSelectedDomain}
      />

      <GettingStarted
        hasDomains={domains.length > 0}
        hasAPIKeys={hasAPIKeys}
        hasTrackedEvents={hasTrackedEvents}
      />

      {!hasTrackedEvents && (
        <Alert
          type="info"
          title="No data yet"
          message="Install the tracking code on your website to start collecting analytics. Go to API Keys to generate your tracking key."
        />
      )}

      <MetricsCards realtimeStats={realtimeStats} overviewStats={overviewStats} />

      <TrafficChart realtimeStats={realtimeStats} period={period} onPeriodChange={setPeriod} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPages realtimeStats={realtimeStats} />
        <TopReferrers realtimeStats={realtimeStats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DeviceStats realtimeStats={realtimeStats} />
        <BrowserStats realtimeStats={realtimeStats} />
        <CountryStats realtimeStats={realtimeStats} />
      </div>

      {selectedDomainData && <DomainInfoCard domain={selectedDomainData} />}
    </div>
  );
}
