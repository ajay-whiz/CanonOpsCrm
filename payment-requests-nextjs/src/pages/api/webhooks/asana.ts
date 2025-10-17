import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';
import { supabase } from '../../../lib/supabaseClient';

const ASANA_SECRET = process.env.ASANA_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const signature = req.headers['x-asana-signature'];
    const body = JSON.stringify(req.body);
    const hmac = createHmac('sha256', ASANA_SECRET).update(body).digest('hex');

    if (signature !== hmac) {
        return res.status(403).json({ message: 'Invalid signature' });
    }

    const { events } = req.body;

    for (const event of events) {
        if (event.action === 'create' && event.resource.type === 'task') {
            const { id, name, due_on } = event.resource;

            const { error } = await supabase
                .from('payment_requests')
                .insert([{ asana_id: id, title: name, due_date: due_on }]);

            if (error) {
                return res.status(500).json({ message: 'Error creating payment request', error });
            }
        }
    }

    return res.status(200).json({ message: 'Webhook processed successfully' });
}