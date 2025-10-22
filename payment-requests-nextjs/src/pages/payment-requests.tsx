import React from 'react';
import PaymentForm from '../components/payments/PaymentForm';
import PaymentList from '../components/payments/PaymentList';

const PaymentRequestsPage: React.FC = () => {
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Create Payment Request</div>
        <div className="card-body">
          <PaymentForm />
        </div>
      </div>
      <PaymentList />
    </div>
  );
};

export default PaymentRequestsPage;
