'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

const noopSubscribe = () => () => {};

type Props = {
	open: boolean;
	onClose: () => void;
	title: string;
	search: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	closeLabel?: string;
	children: React.ReactNode;
};

// Full-height search view: search bar pinned to the top, results fill the rest.
// Nothing is anchored to the bottom, so the keyboard just overlays the list.
export default function FullScreenSearch({
	open,
	onClose,
	title,
	search,
	onSearchChange,
	searchPlaceholder,
	closeLabel = 'Cancel',
	children
}: Props) {
	const mounted = useSyncExternalStore(
		noopSubscribe,
		() => true,
		() => false
	);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() => inputRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [open]);

	if (!mounted) return null;

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			aria-hidden={!open}
			className={`bg-bg fixed inset-0 z-60 flex h-dvh flex-col transition duration-200 ease-out ${
				open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
			}`}
		>
			<div
				className="border-border shrink-0 border-b px-4 pb-3"
				style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
			>
				<h2 className="text-main mb-3 text-lg font-semibold">{title}</h2>
				<div className="flex items-center gap-3">
					<div className="bg-main/5 flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
						<Search className="text-sub h-4 w-4 shrink-0" />
						<input
							ref={inputRef}
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder={searchPlaceholder}
							autoComplete="off"
							enterKeyHint="search"
							className="text-main placeholder:text-sub w-full bg-transparent text-base outline-none"
						/>
						{search && (
							<button
								type="button"
								onClick={() => {
									onSearchChange('');
									inputRef.current?.focus();
								}}
								aria-label="Clear search"
								className="text-sub hover:text-main shrink-0"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-accent shrink-0 text-[15px] font-semibold"
					>
						{closeLabel}
					</button>
				</div>
			</div>

			<div
				className="flex-1 overflow-y-auto overscroll-contain px-3 py-2"
				style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
			>
				{children}
			</div>
		</div>,
		document.body
	);
}
