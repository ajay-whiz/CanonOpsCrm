import { NextApiRequest, NextApiResponse } from 'next';
import { googleDriveClient } from '../../../lib/googleDriveClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { folderName } = req.body;

        try {
            const folder = await googleDriveClient.createFolder(folderName);
            res.status(200).json({ folder });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create folder in Google Drive' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}