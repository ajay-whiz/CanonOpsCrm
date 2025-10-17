import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const usePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*');

    if (error) {
      setError(error.message);
    } else {
      setPayments(data);
    }
    setLoading(false);
  };

  const createPayment = async (payment) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment]);

    if (error) {
      setError(error.message);
    } else {
      setPayments((prev) => [...prev, data[0]]);
    }
  };

  const approvePayment = async (id) => {
    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === id ? { ...payment, status: 'approved' } : payment
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