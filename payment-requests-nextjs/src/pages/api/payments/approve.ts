import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { getSession } from '../../../lib/auth'; // Assuming you have a function to get the session

export default async function approvePayment(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const session = await getSession(req);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { paymentId } = req.body;

    if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID is required' });
    }

    const { data, error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

    if (error) {
        return res.status(500).json({ message: 'Error approving payment', error });
    }

    return res.status(200).json({ message: 'Payment approved', data });
}