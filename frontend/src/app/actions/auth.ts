'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

import { ENV } from '@/lib/env';

const BACKEND_URL = ENV.BACKEND_URL;

export type AuthState = {
    success: boolean;
    error: string | null;
    user?: any;
};

export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
    }

    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email,
            password,
        });

        const { token, user } = response.data;

        // Set cookie
        (await cookies()).set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return { success: true, user, error: null };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Login failed',
        };
    }
}

export async function logout() {
    (await cookies()).delete('token');
    return { success: true };
}

export async function register(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
    }

    if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
            email,
            password,
        });

        const { token, user } = response.data;

        (await cookies()).set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return { success: true, user, error: null };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Registration failed',
        };
    }
}
