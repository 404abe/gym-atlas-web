'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useCyclingPlaceholder } from '@/hooks/useCyclingPlaceholder';
import { cn } from '@/lib/utils';
import type { PaletteAnchor } from '@/components/ui/CommandPalette';

// One example per searchable category (gym / machine / exercise) plus a resting
// prompt. Module constant so the hook's reference stays stable across renders.
const EXAMPLES = [
	'Search anything…',
	'Try “T-bar row”',
	'Try “PureGym Aberdeen”',
	'Try “Cybex leg press”',
	'Try “gyms near Dundee”',
	'Try “Matrix leg extension”'
];

/**
 * Floating pill that stands in for the old tabbed search widget. It's a button,
 * not a field — clicking (or ⌘K, or typing while focused) opens the global
 * command palette. `open` pauses the placeholder animation while the palette is up.
 */
export default function SearchTrigger({
	open,
	onOpen
}: {
	open: boolean;
	/**
	 * Opens the palette. `initialQuery` seeds it when the user types on the button;
	 * `anchor` is the button's box so the palette can expand in place from it.
	 */
	onOpen: (initialQuery?: string, anchor?: PaletteAnchor) => void;
}) {
	const [focused, setFocused] = useState(false);
	const placeholder = useCyclingPlaceholder(EXAMPLES, focused || open);

	const rectOf = (el: HTMLElement): PaletteAnchor => {
		const r = el.getBoundingClientRect();
		return { left: r.left, top: r.top, width: r.width };
	};

	return (
		<button
			type="button"
			onClick={(e) => onOpen(undefined, rectOf(e.currentTarget))}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onOpen(undefined, rectOf(e.currentTarget));
					return;
				}
				// A printable keystroke opens the palette seeded with that char, so
				// the button doesn't feel like a dead target when you start typing.
				if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
					e.preventDefault();
					onOpen(e.key, rectOf(e.currentTarget));
				}
			}}
			aria-label="Search gyms, exercises, and machines"
			className={cn(
				'border-border bg-bg hover:border-sub pointer-events-auto flex h-[52px] w-full items-center gap-2.5 rounded-2xl border px-4 text-left shadow-lg transition md:w-[340px]',
				// Hidden (but still laid out, so ⌘K can measure it) while the palette
				// expands over it, so the pill doesn't peek behind the panel.
				open && 'opacity-0'
			)}
		>
			<Search size={17} className="text-sub shrink-0" />
			<span className="text-sub min-w-0 flex-1 truncate text-[13px]">{placeholder}</span>
			<kbd className="border-border bg-sub-alt text-sub hidden shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium md:flex">
				⌘K
			</kbd>
		</button>
	);
}
