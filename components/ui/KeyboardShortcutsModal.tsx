'use client';

import { X } from 'lucide-react';

function Kbd({ children }: { children: React.ReactNode }) {
	return (
		<span className="border-border bg-sub-alt text-sub flex h-6 min-w-[24px] items-center justify-center rounded-md border px-1.5 text-xs font-medium">
			{children}
		</span>
	);
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
	return (
		<div className="border-border flex items-center justify-between border-b px-5 py-3 last:border-b-0">
			<span className="text-main text-sm">{label}</span>
			<div className="flex items-center gap-1">
				{keys.map((key, i) => (
					<Kbd key={i}>{key}</Kbd>
				))}
			</div>
		</div>
	);
}

export default function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div className="border-border bg-surface w-full max-w-sm rounded-2xl border shadow-xl">
				<div className="border-border flex items-center gap-3 border-b px-5 py-4">
					<h2 className="text-main flex-1 text-base font-semibold">Keyboard shortcuts</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-sub hover:text-main shrink-0 rounded-lg p-1 transition"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="px-2 py-1">
					<p className="text-sub px-3 pb-1 pt-2 text-[11px] uppercase tracking-wide">General</p>
					<ShortcutRow label="Toggle sidebar" keys={['⌘', '.']} />
					<ShortcutRow label="Search" keys={['⌘', 'K']} />
					<ShortcutRow label="Keyboard shortcuts" keys={['?']} />
				</div>
			</div>
		</div>
	);
}
