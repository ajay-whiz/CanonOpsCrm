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
          .select('id, description, amount, pr_status')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payments:', error);
          return;
        }

        if (mounted && Array.isArray(data)) {
          setPayments(data as Payment[]);
        }
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

  if (loading) return <div>Loading...</div>;
  if (payments.length === 0) return <div>No payment requests found.</div>;

  return (
    <div>
      <h2>Payment Requests</h2>
      <ul>
        {payments.map((payment) => {
          const amount =
            typeof payment.amount === 'number'
              ? payment.amount.toFixed(2)
              : payment.amount ?? '0.00';
          const status = payment.pr_status ?? payment.status ?? 'staging';
          return (
            <li key={payment.id}>
              <p>{payment.description ?? 'No description'}</p>
              <p>Amount: ${amount}</p>
              <p>Status: {status}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PaymentList;