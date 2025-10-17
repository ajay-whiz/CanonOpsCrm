import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../ui/Button';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{ amount: parseFloat(amount), description }]);

      if (error) throw error;

      // Reset form fields
      setAmount('');
      setDescription('');
      alert('Payment request created successfully!');
    } catch (error) {
      setError('Error creating payment request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Payment Request'}
      </Button>
    </form>
  );
};

export default PaymentForm;