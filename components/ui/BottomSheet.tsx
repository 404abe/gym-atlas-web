'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

type Props = {
	open: boolean;
	onClose: () => void;
	title: string;
	search?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

export default function BottomSheet({
	open,
	onClose,
	title,
	search,
	onSearchChange,
	searchPlaceholder,
	children,
	footer
}: Props) {
	const [mounted, setMounted] = useState(false);
	const [keyboardOffset, setKeyboardOffset] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => setMounted(true), []);

	// Lift the sheet above the on-screen keyboard. The keyboard shrinks the visual
	// viewport but not the layout viewport that `fixed bottom-0` is anchored to.
	useEffect(() => {
		const vv = window.visualViewport;
		if (!open || !vv) return;

		const measure = () =>
			setKeyboardOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));

		const frame = requestAnimationFrame(() => measure());
		vv.addEventListener('resize', measure);
		vv.addEventListener('scroll', measure);
		return () => {
			cancelAnimationFrame(frame);
			vv.removeEventListener('resize', measure);
			vv.removeEventListener('scroll', measure);
		};
	}, [open]);

	const liftBy = open ? keyboardOffset : 0;

	// Focus on the next frame rather than synchronously on open, so the keyboard
	// starts animating after the sheet is in place.
	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() => inputRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [open]);

	if (!mounted) return null;

	return createPortal(
		<>
			<div
				onClick={onClose}
				aria-hidden="true"
				className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
					open ? 'opacity-100' : 'pointer-events-none opacity-0'
				}`}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				aria-hidden={!open}
				className={`bg-surface fixed inset-x-0 bottom-0 z-50 flex max-h-[82dvh] flex-col rounded-t-3xl shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
					open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
				}`}
				style={
					liftBy > 0
						? { bottom: liftBy, maxHeight: `calc(${window.innerHeight - liftBy}px - 2rem)` }
						: undefined
				}
			>
				<div className="bg-border mx-auto mt-2.5 h-1.5 w-9 shrink-0 rounded-full" />

				<div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
					<h2 className="text-main text-lg font-semibold">{title}</h2>
					<button
						onClick={onClose}
						aria-label="Close"
						className="bg-sub-alt text-sub hover:text-main flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition"
					>
						<X className="h-3.5 w-3.5" />
					</button>
				</div>

				{onSearchChange && (
					<div className="bg-main/5 mx-5 mb-1.5 flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5">
						<Search className="text-sub h-4 w-4 shrink-0" />
						<input
							ref={inputRef}
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder={searchPlaceholder}
							className="text-main placeholder:text-sub w-full bg-transparent text-sm outline-none"
						/>
					</div>
				)}

				<div className="flex-1 overflow-y-auto px-3 pb-2">{children}</div>

				{footer && (
					<div
						className="border-border shrink-0 border-t p-4"
						style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
					>
						{footer}
					</div>
				)}
			</div>
		</>,
		document.body
	);
}
