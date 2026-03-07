'use server';

import { cookies } from 'next/headers';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email');
    const password = formData.get('password');

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

        return { success: true, user };
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

export async function register(prevState: any, formData: FormData) {
    const email = formData.get('email');
    const password = formData.get('password');

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

        return { success: true, user };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Registration failed',
        };
    }
}
