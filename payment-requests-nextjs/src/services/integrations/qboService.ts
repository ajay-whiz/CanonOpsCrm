import { QBOClient } from '../../lib/qboClient';

export const createVendor = async (vendorData) => {
    try {
        const response = await QBOClient.post('/vendors', vendorData);
        return response.data;
    } catch (error) {
        throw new Error(`Error creating vendor: ${error.message}`);
    }
};

export const updateVendor = async (vendorId, vendorData) => {
    try {
        const response = await QBOClient.put(`/vendors/${vendorId}`, vendorData);
        return response.data;
    } catch (error) {
        throw new Error(`Error updating vendor: ${error.message}`);
    }
};

export const getVendor = async (vendorId) => {
    try {
        const response = await QBOClient.get(`/vendors/${vendorId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching vendor: ${error.message}`);
    }
};

export const listVendors = async () => {
    try {
        const response = await QBOClient.get('/vendors');
        return response.data;
    } catch (error) {
        throw new Error(`Error listing vendors: ${error.message}`);
    }
};