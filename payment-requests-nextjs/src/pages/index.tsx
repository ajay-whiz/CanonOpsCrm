import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PaymentList from '../components/payments/PaymentList';
import PaymentForm from '../components/payments/PaymentForm';

const Home = () => {
  const [payments, setPayments] = useState([]);

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
    };

    fetchPayments();
  }, []);

  return (
    <div>
      <h1>Payment Requests</h1>
      <PaymentForm />
      <PaymentList payments={payments} />
    </div>
  );
};

export default Home;