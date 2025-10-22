import React from 'react';
import { supabaseServer } from '../../lib/supabase-server';

export const dynamic = 'force-dynamic';

type StatRow = { pr_status: string; count: number; total_amount: number };

type DailyRow = { day: string; count: number; total_amount: number };

async function getStatusStats(): Promise<StatRow[]> {
  const { data, error } = await supabaseServer
    .from('payment_request')
    .select('pr_status, amount');
  if (error || !data) return [];
  const map = new Map<string, { count: number; total: number }>();
  for (const row of data as any[]) {
    const k = row.pr_status || 'unknown';
    const entry = map.get(k) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(row.amount || 0);
    map.set(k, entry);
  }
  return Array.from(map.entries()).map(([pr_status, v]) => ({ pr_status, count: v.count, total_amount: v.total }));
}

async function getDailyStats(): Promise<DailyRow[]> {
  const { data, error } = await supabaseServer
    .from('payment_request')
    .select('created_at, amount');
  if (error || !data) return [];
  const map = new Map<string, { count: number; total: number }>();
  for (const row of data as any[]) {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    const entry = map.get(day) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(row.amount || 0);
    map.set(day, entry);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({ day, count: v.count, total_amount: v.total }));
}

export default async function ReportsPage() {
  const [statusStats, dailyStats] = await Promise.all([getStatusStats(), getDailyStats()]);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Finance Dashboard</div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem' }}>
            {statusStats.map((s) => (
              <div key={s.pr_status} className="card" style={{ padding: '0.75rem' }}>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{s.pr_status}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{s.count}</div>
                <div style={{ color: '#475569' }}>${s.total_amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Daily Totals</div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Count</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((d) => (
                  <tr key={d.day}>
                    <td>{d.day}</td>
                    <td>{d.count}</td>
                    <td>${d.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
