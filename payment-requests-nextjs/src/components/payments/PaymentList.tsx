import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Payment = {
  id: string;
  description?: string | null;
  amount?: number | null;
  pr_status?: string | null; // supabase column from sprint schema
  status?: string | null; // fallback if your table uses `status`
};
const PaymentList: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_request') // use canonical table name; change to 'payments' if your DB uses that
          .select('id, description, amount, pr_status, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payments:', error);
          return;
        }
        if (mounted && Array.isArray(data)) setPayments(data as Payment[]);
      } catch (err) {
        console.error('Unexpected error fetching payments:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPayments();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="card">
        <div className="card-body">Loading payment requests…</div>
      </div>
    );
  if (payments.length === 0)
    return (
      <div className="card">
        <div className="card-body">No payment requests found.</div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-header">Payment Requests</div>
      <div className="card-body" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const amount =
                  typeof payment.amount === 'number'
                    ? payment.amount.toFixed(2)
                    : payment.amount ?? '0.00';
                const status = (payment.pr_status ?? payment.status ?? 'staging').toString();
                return (
                  <tr key={payment.id}>
                    <td style={{ width: 120 }}>
                      <code>{payment.id}</code>
                    </td>
                    <td>{payment.description ?? '—'}</td>
                    <td>${amount}</td>
                    <td>
                      <span className={`badge ${status}`}>{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;