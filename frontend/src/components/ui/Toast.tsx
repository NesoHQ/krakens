'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-success',
    error: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-error',
    info: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-primary',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 duration-300">
      <div className={`${styles} px-6 py-3 rounded-lg shadow-xl border-l-4 flex items-center space-x-3 min-w-[300px]`}>
        <span className="text-xl font-bold">{icon}</span>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
