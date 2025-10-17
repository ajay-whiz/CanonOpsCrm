import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function createPayment(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { amount, description, userId } = req.body;

    if (!amount || !description || !userId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const { data, error } = await supabase
        .from('payments')
        .insert([{ amount, description, user_id: userId }]);

    if (error) {
        return res.status(500).json({ message: 'Error creating payment request', error });
    }

    return res.status(201).json({ message: 'Payment request created', data });
}