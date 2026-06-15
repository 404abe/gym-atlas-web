'use client';

import { Check, X, AlertCircle, Info } from 'lucide-react';
import { Toast } from '../hooks/useToast';

type Props = {
	toasts: Toast[];
	onRemove: (id: string) => void;
};

const icons = {
	success: <Check className="h-3.5 w-3.5 shrink-0" />,
	error: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
	info: <Info className="h-3.5 w-3.5 shrink-0" />,
};

const styles = {
	success: 'bg-green-600 text-white',
	error: 'bg-red-600 text-white',
	info: 'bg-surface text-main',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
	return (
		<div
			className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-lg text-sm animate-in slide-in-from-right-4 fade-in duration-200 ${styles[toast.type]}`}
		>
			{icons[toast.type]}
			<span className="flex-1">{toast.message}</span>
			<button
				onClick={() => onRemove(toast.id)}
				className="ml-1 opacity-70 hover:opacity-100 transition shrink-0"
			>
				<X className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

export default function ToastContainer({ toasts, onRemove }: Props) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed right-4 top-18 z-[80] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 md:right-6 md:top-20">
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
			))}
		</div>
	);
}
