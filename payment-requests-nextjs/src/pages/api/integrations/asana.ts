import { NextApiRequest, NextApiResponse } from 'next';
import { asanaClient } from '../../../lib/asanaClient';
import { createPaymentRequest } from '../../../services/integrations/asanaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { event } = req.body;

        try {
            // Process the incoming Asana event
            if (event && event.type === 'task.completed') {
                const paymentRequest = await createPaymentRequest(event);
                return res.status(200).json(paymentRequest);
            }

            return res.status(400).json({ message: 'Event type not supported' });
        } catch (error) {
            console.error('Error processing Asana event:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}