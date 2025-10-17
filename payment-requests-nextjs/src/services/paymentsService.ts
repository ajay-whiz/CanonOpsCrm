import { supabase } from '../lib/supabaseClient';

export const createPaymentRequest = async (paymentData) => {
    const { data, error } = await supabase
        .from('payment_requests')
        .insert([paymentData]);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const fetchPaymentRequests = async () => {
    const { data, error } = await supabase
        .from('payment_requests')
        .select('*');

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const approvePaymentRequest = async (id) => {
    const { data, error } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};