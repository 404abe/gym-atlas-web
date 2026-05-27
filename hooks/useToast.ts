'use client';

import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
	id: string;
	message: string;
	type: ToastType;
};

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: ToastType = 'success') => {
		const id = Math.random().toString(36).slice(2);
		setToasts((prev) => [...prev, { id, message, type }]);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return { toasts, addToast, removeToast };
}
