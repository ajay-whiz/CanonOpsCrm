import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function callback(req: NextApiRequest, res: NextApiResponse) {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'Missing access token or refresh token' });
    }

    const { user, error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({ user });
}