import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*');

      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        setPayments(data);
      }
      setLoading(false);
    };

    fetchPayments();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Payment Requests</h2>
      <ul>
        {payments.map(payment => (
          <li key={payment.id}>
            <p>{payment.description}</p>
            <p>Amount: ${payment.amount}</p>
            <p>Status: {payment.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PaymentList;