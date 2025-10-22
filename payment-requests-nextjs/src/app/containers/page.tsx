import React from 'react';
import { supabaseServer } from '../../lib/supabase-server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function upsertContainer(formData: FormData) {
  'use server';
  const name = (formData.get('name') || '').toString().trim();
  const external_id = (formData.get('external_id') || '').toString().trim();
  if (!name && !external_id) return;

  const payload: any = { name: name || null, external_id: external_id || null };
  const { error } = await supabaseServer
    .from('container')
    .upsert([payload], external_id ? { onConflict: 'external_id' } : { onConflict: 'name' });

  revalidatePath('/containers');
}

export default async function ContainersPage() {
  const { data } = await supabaseServer
    .from('container')
    .select('id, name, external_id, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Upsert Container</div>
        <div className="card-body">
          <form action={upsertContainer}>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 3fr', alignItems: 'center' }}>
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" />
              <label htmlFor="external_id">External ID</label>
              <input id="external_id" name="external_id" type="text" />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Containers</div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>External ID</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row: any) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td>{row.name || '—'}</td>
                    <td>{row.external_id || '—'}</td>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
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
