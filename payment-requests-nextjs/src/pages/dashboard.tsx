import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import PaymentList from '../components/payments/PaymentList';

const Dashboard = () => {
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
      <h1>Dashboard</h1>
      <PaymentList payments={payments} />
    </div>
  );
};

export default Dashboard;