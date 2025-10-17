import { NextApiRequest, NextApiResponse } from 'next';
import { qboClient } from '../../../lib/qboClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { vendorData } = req.body;

            // Upsert vendor in QuickBooks Online
            const response = await qboClient.vendor.upsert(vendorData);

            res.status(200).json(response);
        } catch (error) {
            console.error('Error upserting vendor:', error);
            res.status(500).json({ error: 'Failed to upsert vendor' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}