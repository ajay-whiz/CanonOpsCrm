import React from 'react';
import PaymentList from '../../components/payments/PaymentList';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <div className="container">
      <PaymentList />
    </div>
  );
}
