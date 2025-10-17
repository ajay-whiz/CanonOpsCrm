import { render, screen } from '@testing-library/react';
import PaymentList from '../../src/components/payments/PaymentList';
import { usePayments } from '../../src/hooks/usePayments';

jest.mock('../../src/hooks/usePayments');

describe('PaymentList', () => {
  const mockPayments = [
    { id: 1, amount: 100, status: 'Pending' },
    { id: 2, amount: 200, status: 'Approved' },
  ];

  beforeEach(() => {
    (usePayments as jest.Mock).mockReturnValue({
      payments: mockPayments,
      isLoading: false,
    });
  });

  it('renders payment list correctly', () => {
    render(<PaymentList />);
    
    expect(screen.getByText('Payment Requests')).toBeInTheDocument();
    expect(screen.getByText('Amount: $100')).toBeInTheDocument();
    expect(screen.getByText('Status: Pending')).toBeInTheDocument();
    expect(screen.getByText('Amount: $200')).toBeInTheDocument();
    expect(screen.getByText('Status: Approved')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (usePayments as jest.Mock).mockReturnValue({
      payments: [],
      isLoading: true,
    });

    render(<PaymentList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles empty payment list', () => {
    (usePayments as jest.Mock).mockReturnValue({
      payments: [],
      isLoading: false,
    });

    render(<PaymentList />);

    expect(screen.getByText('No payment requests found.')).toBeInTheDocument();
  });
});