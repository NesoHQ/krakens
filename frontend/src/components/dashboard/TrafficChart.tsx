'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import type { RealtimeStats } from '@/types';

interface TrafficChartProps {
  realtimeStats: RealtimeStats | null;
  period: string;
  onPeriodChange: (period: string) => void;
}

export default function TrafficChart({ realtimeStats, period, onPeriodChange }: TrafficChartProps) {
  const hasData = (realtimeStats?.hits_per_minute?.length || 0) > 0;
  const totalHits = realtimeStats?.hits_per_minute?.reduce((sum, item) => sum + item.hits, 0) || 0;
  const peakTraffic = Math.max(...(realtimeStats?.hits_per_minute?.map(item => item.hits) || [0]));

  const getPeriodLabel = () => {
    switch (period) {
      case "24h": return "last 24 hours";
      case "7d": return "last 7 days";
      case "30d": return "last 30 days";
      default: return "last 60 minutes";
    }
  };

  const getGranularityLabel = () => {
    switch (period) {
      case "24h": return "Page views per hour";
      case "7d":
      case "30d": return "Page views per day";
      default: return "Page views per minute";
    }
  };

  const avgValue = period === "60m"
    ? (totalHits / 60).toFixed(1)
    : (totalHits / (realtimeStats?.hits_per_minute?.length || 1)).toFixed(1);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Traffic Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{getGranularityLabel()} ({getPeriodLabel()})</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start">
          {[
            { id: '60m', label: 'Live' },
            { id: '24h', label: '24h' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${period === p.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="relative">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={realtimeStats?.hits_per_minute || []}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
                vertical={false}
              />
              <XAxis
                dataKey="minute"
                className="text-muted-foreground"
                style={{ fontSize: '11px' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                className="text-muted-foreground"
                style={{ fontSize: '11px' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
                  color: 'hsl(var(--popover-foreground))',
                  padding: '12px 16px'
                }}
                labelStyle={{
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{
                  color: 'hsl(var(--primary))',
                  fontWeight: 500
                }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Line
                type="monotone"
                dataKey="hits"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: 'hsl(var(--primary))',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: 3
                }}
                fill="url(#colorHits)"
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalHits}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Hits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{peakTraffic}</div>
              <div className="text-xs text-muted-foreground mt-1">Peak Traffic</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{avgValue}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {period === "60m" ? "Avg per Minute" : "Avg per Unit"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <p className="text-lg font-medium text-muted-foreground mb-2">No traffic data yet</p>
            <p className="text-sm text-muted-foreground/70">Data will appear here once visitors start browsing your site</p>
          </div>
        </div>
      )}
    </Card>
  );
}
