import React from 'react';
import { supabaseServer } from '../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage() {
  const { data, error } = await supabaseServer
    .from('audit_log')
    .select('id, created_at, actor_user_id, entity_type, entity_id, action, details')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">Audit Log</div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row: any) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>{row.actor_user_id ?? 'system'}</td>
                    <td>{row.entity_type}#{row.entity_id}</td>
                    <td>{row.action}</td>
                    <td><pre style={{ margin: 0 }}>{JSON.stringify(row.details ?? {}, null, 2)}</pre></td>
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
