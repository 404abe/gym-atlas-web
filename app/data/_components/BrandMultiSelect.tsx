'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';

type Props = {
	brands: string[];
	selected: string[];
	onChange: (brands: string[]) => void;
	logos: Record<string, string | null>;
};

export default function BrandMultiSelect({ brands, selected, onChange, logos }: Props) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (e: PointerEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	const toggle = (brand: string) =>
		onChange(selected.includes(brand) ? selected.filter((b) => b !== brand) : [...selected, brand]);

	const label =
		selected.length === 0
			? 'All brands'
			: selected.length === 1
				? selected[0]
				: `${selected[0]} +${selected.length - 1}`;

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-label="Filter by brand"
				className="select-toolbar flex items-center gap-1.5"
			>
				<span className="max-w-40 truncate">{label}</span>
				<ChevronDown className="text-sub h-3.5 w-3.5" />
			</button>

			{open && (
				<div
					role="group"
					aria-label="Brands"
					className="bg-surface border-border absolute left-0 top-full z-20 mt-1 flex max-h-72 w-64 flex-col overflow-auto rounded-xl border p-1 shadow-lg"
				>
					{selected.length > 0 && (
						<button
							type="button"
							onClick={() => onChange([])}
							className="text-sub hover:text-main px-2 py-1.5 text-left text-xs underline"
						>
							Clear brands
						</button>
					)}
					{brands.map((brand) => {
						const checked = selected.includes(brand);
						return (
							<label
								key={brand}
								className="hover:bg-sub-alt flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5"
							>
								<input
									type="checkbox"
									checked={checked}
									onChange={() => toggle(brand)}
									className="sr-only"
								/>
								<BrandLogo name={brand} logoUrl={logos[brand]} className="h-7 w-7" />
								<span className="text-main min-w-0 flex-1 truncate text-sm">{brand}</span>
								<span
									className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
										checked ? 'bg-main border-main text-bg' : 'border-border'
									}`}
									aria-hidden="true"
								>
									{checked && <Check className="h-3 w-3" />}
								</span>
							</label>
						);
					})}
				</div>
			)}
		</div>
	);
}
