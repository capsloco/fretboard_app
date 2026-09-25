import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ACCURACY_RANGES, bucketAccuracyByRange } from '../../lib/statsLogic';
import { formatDate } from '../../lib/formatters';

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 6,
  background: 'var(--color-base-100)',
  border: '1px solid var(--color-base-300)',
  color: 'var(--color-base-content)'
};

export default function AccuracyChart({ sessions }) {
  const [rangeKey, setRangeKey] = useState('30d');

  const data = useMemo(() => bucketAccuracyByRange(sessions, rangeKey), [sessions, rangeKey]);

  return (
    <div className="card bg-base-100 shadow-md p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em]">
          <TrendingUp className="size-4 text-secondary" aria-hidden="true" />
          Accuracy Over Time
        </h3>
        <div role="tablist" className="tabs tabs-box tabs-sm w-fit">
          {ACCURACY_RANGES.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-label={r.label}
              aria-selected={rangeKey === r.key}
              className={`tab font-display ${rangeKey === r.key ? 'tab-active' : ''}`}
              onClick={() => setRangeKey(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm opacity-70">
          No rounds in this range yet
        </div>
      ) : (
        <div className="h-56 text-primary">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-base-300" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                tick={{ fontSize: 11 }}
                className="fill-base-content/70"
                minTickGap={30}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                className="fill-base-content/70"
                width={36}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Accuracy']}
                labelFormatter={(d) => formatDate(d)}
                contentStyle={TOOLTIP_STYLE}
              />
              <Area
                type="monotone"
                dataKey="accuracyPct"
                stroke="currentColor"
                strokeWidth={2}
                fill="url(#accuracyFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
