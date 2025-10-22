import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'crypto';
import { supabaseServer } from '../../../lib/supabase-server';

const ASANA_SECRET = process.env.ASANA_SECRET || '';

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

    const { events = [] } = req.body as { events?: any[] };

    for (const event of events) {
        if (event.action === 'create' && event.resource.type === 'task') {
            const { id, gid, name, due_on } = event.resource;

            // Build an idempotency key for this event
            const eventId = `${gid || id || 'unknown'}:${event.action}`;

            // Try to insert into webhook_events to enforce idempotency
            const { error: idemErr } = await supabaseServer
                .from('webhook_events')
                .insert([{ source: 'asana', event_id: eventId }]);

            if (idemErr && !/duplicate key/i.test(idemErr.message)) {
                return res.status(500).json({ message: 'Idempotency check failed', error: idemErr.message });
            }
            if (idemErr && /duplicate key/i.test(idemErr.message)) {
                // Already processed
                continue;
            }

            // Create payment request with staging status
            const { data: prData, error: prErr } = await supabaseServer
                .from('payment_request')
                .insert([{ asana_id: gid || id, title: name, due_date: due_on, pr_status: 'staging' }])
                .select('id')
                .single();

            if (prErr) {
                return res.status(500).json({ message: 'Error creating payment request', error: prErr.message });
            }

            // Write audit log
            await supabaseServer
                .from('audit_log')
                .insert([{ actor_user_id: null, entity_type: 'payment_request', entity_id: String(prData.id), action: 'created_from_asana', details: { event } }]);
        }
    }

    return res.status(200).json({ message: 'Webhook processed successfully' });
}