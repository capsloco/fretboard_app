import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target } from 'lucide-react';

export default function WeakNotesBreakdown({ notes }) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl p-4 sm:p-5 shadow-md">
      <div className="flex items-center gap-2 font-bold text-base-content mb-4">
        <Target className="w-4 h-4 text-primary" />
        Weakest Notes
      </div>

      {!notes || notes.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-base-content/60 text-sm font-mono text-center px-4">
          Complete a tracked session to see your weak notes
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
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="accuracyPct" radius={[0, 6, 6, 0]}>
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
