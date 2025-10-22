import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Payment = {
  id: string;
  description?: string | null;
  amount?: number | null;
  pr_status?: 'staging' | 'pending' | 'approved' | 'rejected' | null;
};

const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_request')
      .select('id, description, amount, pr_status')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setPayments((data as Payment[]) ?? []);
    }
    setLoading(false);
  };

  const createPayment = async (payment: { amount: number; description: string }) => {
    const { data, error } = await supabase
      .from('payment_request')
      .insert([{ ...payment, pr_status: 'staging' }])
      .select('id, description, amount, pr_status');

    if (error) {
      setError(error.message);
    } else {
      setPayments((prev) => [...prev, ...(data as Payment[])]);
    }
  };

  const approvePayment = async (id: string) => {
    const { data, error } = await supabase
      .from('payment_request')
      .update({ pr_status: 'approved' })
      .eq('id', id)
      .select('id, pr_status');

    if (error) {
      setError(error.message);
    } else {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === id ? { ...payment, pr_status: 'approved' } : payment
        )
      );
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return { payments, loading, error, createPayment, approvePayment };
};

export default usePayments;