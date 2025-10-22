import React from 'react';
import { supabaseServer } from '../../lib/supabase-server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function upsertContact(formData: FormData) {
  'use server';
  const email = (formData.get('email') || '').toString().trim();
  const name = (formData.get('name') || '').toString().trim();
  if (!email && !name) return;

  const payload: any = { email: email || null, name: name || null };
  const { error } = await supabaseServer
    .from('contact')
    .upsert([payload], email ? { onConflict: 'email' } : undefined);

  // Best-effort refresh
  revalidatePath('/contacts');
}

export default async function ContactsPage() {
  const { data } = await supabaseServer
    .from('contact')
    .select('id, email, name, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Upsert Contact</div>
        <div className="card-body">
          <form action={upsertContact}>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 3fr', alignItems: 'center' }}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" />
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Contacts</div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data || []).map((row: any) => (
                  <tr key={row.id}>
                    <td><code>{row.id}</code></td>
                    <td>{row.email || '—'}</td>
                    <td>{row.name || '—'}</td>
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
