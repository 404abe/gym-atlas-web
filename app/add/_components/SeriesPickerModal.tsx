'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Plus, Search, X } from 'lucide-react';
import { fetchSeriesByBrandId } from '@/lib/api';
import type { EquipmentSeriesItem } from '@/lib/api';

type Props = {
	brandId: number;
	brandName: string;
	selected: string;
	onConfirm: (seriesName: string) => void;
	onClose: () => void;
};

export default function SeriesPickerModal({
	brandId,
	brandName,
	selected,
	onConfirm,
	onClose
}: Props) {
	const [seriesOptions, setSeriesOptions] = useState<EquipmentSeriesItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [pending, setPending] = useState(selected);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		let cancelled = false;
		fetchSeriesByBrandId(brandId)
			.then((data) => { if (!cancelled) setSeriesOptions(data ?? []); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [brandId]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const trimmed = search.trim();
	const filtered = trimmed
		? seriesOptions.filter((s) => s.name.toLowerCase().includes(trimmed.toLowerCase()))
		: seriesOptions;
	const showCreateRow = trimmed.length > 0 && !filtered.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());

	const handleOverlayClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) onClose();
		},
		[onClose]
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={handleOverlayClick}
		>
			<div
				className="bg-surface border-border flex w-full max-w-sm flex-col rounded-2xl border shadow-xl"
				style={{ maxHeight: '80vh' }}
			>
				{/* Header */}
				<div className="border-border flex items-center justify-between border-b px-5 py-4">
					<h2 className="text-main text-base font-semibold">
						Select series &mdash;{' '}
						<span className="text-sub font-normal">{brandName}</span>
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-sub hover:text-main rounded-lg p-1 transition"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Search */}
				<div className="border-border border-b px-5 py-3">
					<div className="border-border bg-sub-alt flex items-center gap-2 rounded-lg border px-3 py-2">
						<Search className="text-sub h-3.5 w-3.5 shrink-0" />
						<input
							ref={inputRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search series…"
							className="text-main placeholder:text-sub w-full bg-transparent text-sm outline-none"
						/>
					</div>
				</div>

				{/* Series list */}
				<div className="min-h-0 flex-1 overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="text-sub h-5 w-5 animate-spin" />
						</div>
					) : (
						<div className="divide-border divide-y">
							{filtered.map((item) => {
								const isSelected = item.name === pending;
								return (
									<button
										key={item.name}
										type="button"
										onClick={() => setPending(item.name)}
										className={`flex w-full items-center justify-between px-5 py-3 text-left transition ${
											isSelected ? 'bg-sub-alt' : 'hover:bg-sub-alt'
										}`}
									>
										<span className={`text-sm font-medium ${isSelected ? 'text-main' : 'text-sub'}`}>
											{item.name}
										</span>
										<span className="text-sub text-xs">{item.equipment_count} machines</span>
									</button>
								);
							})}

							{showCreateRow && (
								<button
									type="button"
									onClick={() => setPending(trimmed)}
									className={`flex w-full items-center gap-2 px-5 py-3 text-left transition ${
										pending === trimmed ? 'bg-sub-alt' : 'hover:bg-sub-alt'
									}`}
								>
									<Plus className="text-sub h-3.5 w-3.5 shrink-0" />
									<span className={`text-sm font-medium ${pending === trimmed ? 'text-main' : 'text-sub'}`}>
										Use &ldquo;{trimmed}&rdquo; as new series
									</span>
								</button>
							)}

							{!showCreateRow && filtered.length === 0 && (
								<p className="text-sub py-4 text-center text-sm">No series found for this brand</p>
							)}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="border-border flex items-center justify-end gap-2 border-t px-5 py-4">
					<button
						type="button"
						onClick={onClose}
						className="border-border text-sub hover:text-main rounded-xl border px-4 py-2 text-sm transition"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => {
							const value = pending || (showCreateRow ? trimmed : '');
							if (value) onConfirm(value);
						}}
						disabled={!pending && !showCreateRow}
						className="bg-main text-bg rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	);
}
