import React from 'react';
import PaymentList from '../../components/payments/PaymentList';
import { supabaseServer } from '../../lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function createPaymentRequest(formData: FormData) {
  'use server';
  const amount = Number(formData.get('amount'));
  const description = String(formData.get('description') || '');
  if (!amount || !description) {
    // No-op; in a fuller UX we would set form state via useFormStatus
    return;
  }

  const { error } = await supabaseServer
    .from('payment_request')
    .insert([{ amount, description, pr_status: 'staging' }]);

  if (error) {
    // For minimal flow, just revalidate; in real app, surface error via formStatus
    revalidatePath('/payment-requests');
    return;
  }
  revalidatePath('/payment-requests');
  redirect('/payment-requests');
}

export default async function PaymentRequestsPage() {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Create Payment Request</div>
        <div className="card-body">
          <form action={createPaymentRequest}>
            <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 3fr', alignItems: 'center' }}>
              <label htmlFor="amount">Amount</label>
              <input id="amount" name="amount" type="number" step="0.01" required />
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" required />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="btn btn-primary" type="submit">Create</button>
            </div>
          </form>
        </div>
      </div>
      <PaymentList />
    </div>
  );
}
