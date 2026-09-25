import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target } from 'lucide-react';

export default function WeakNotesBreakdown({ notes }) {
  return (
    <div className="card bg-base-100 shadow-md p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em] mb-4">
        <Target className="size-4 text-secondary" aria-hidden="true" />
        Weakest Notes
      </h3>

      {!notes || notes.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm opacity-70 text-center px-4">
          Finish a pass / fail round to see which notes trip you up
        </div>
      ) : (
        <div style={{ height: Math.max(160, notes.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={notes} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                dataKey="note"
                type="category"
                width={40}
                tick={{ fontSize: 12, fontWeight: 700 }}
                className="fill-base-content"
              />
              <Tooltip
                formatter={(value, _name, item) => [`${value}% (${item.payload.correct}/${item.payload.attempts})`, 'Accuracy']}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  background: 'var(--color-base-100)',
                  border: '1px solid var(--color-base-300)',
                  color: 'var(--color-base-content)'
                }}
              />
              <Bar dataKey="accuracyPct" radius={[0, 3, 3, 0]}>
                {notes.map((entry) => (
                  <Cell
                    key={entry.note}
                    fill={entry.accuracyPct < 50 ? 'var(--color-error)' : entry.accuracyPct < 80 ? 'var(--color-warning)' : 'var(--color-success)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
