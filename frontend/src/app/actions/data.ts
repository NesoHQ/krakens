'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

async function getAuthHeaders() {
    const token = (await cookies()).get('token')?.value;
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
}

export async function getDomains() {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${BACKEND_URL}/api/domains`, headers);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to fetch domains' };
    }
}

export async function getAPIKeys() {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${BACKEND_URL}/api/api-keys`, headers);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to fetch API keys' };
    }
}

export async function getUnifiedStats(domainId: string, period?: string) {
    if (!domainId) return { success: false, error: 'Domain ID required' };

    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${BACKEND_URL}/api/stats/unified`, {
            ...headers,
            params: {
                domain_id: domainId,
                period: period || '60m'
            },
        });
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to fetch stats' };
    }
}

export async function createDomain(domain: string) {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${BACKEND_URL}/api/domains`, { domain }, headers);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to create domain' };
    }
}

export async function deleteDomain(id: string) {
    try {
        const headers = await getAuthHeaders();
        await axios.delete(`${BACKEND_URL}/api/domains/${id}`, headers);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to delete domain' };
    }
}
export async function createAPIKey(domainIds: string[]) {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${BACKEND_URL}/api/api-keys`, { domain_ids: domainIds }, headers);
        return { success: true, data: response.data };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to create API key' };
    }
}

export async function revokeAPIKey(id: string) {
    try {
        const headers = await getAuthHeaders();
        await axios.delete(`${BACKEND_URL}/api/api-keys/${id}`, headers);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.response?.data?.error || 'Failed to revoke API key' };
    }
}
