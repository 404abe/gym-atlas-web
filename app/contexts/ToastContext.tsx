'use client';

import { createContext, useContext } from 'react';
import { useToast, ToastType } from '@/hooks/useToast';
import ToastContainer from '@/components/ToastContainer';

const ToastContext = createContext<{ addToast: (msg: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const { toasts, addToast, removeToast } = useToast();
	return (
		<ToastContext.Provider value={{ addToast }}>
			<ToastContainer toasts={toasts} onRemove={removeToast} />
			{children}
		</ToastContext.Provider>
	);
}

export const useToastContext = () => useContext(ToastContext)!;
