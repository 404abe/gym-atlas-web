'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Dumbbell, Loader2, Search, X } from 'lucide-react';
import { cn, matchesSearch } from '@/lib/utils';
import { matchesBestInClassCategory } from '@/lib/best-in-class';
import type { Equipment } from '@/types/equipment';
import type { BestInClassCategory } from '@/types/bestInClass';

type Props = {
	category: BestInClassCategory;
	/** null while the machine list is still loading */
	equipment: Equipment[] | null;
	currentEquipmentId?: number;
	saving: boolean;
	onClose: () => void;
	onConfirm: (equipmentId: number) => void;
};

const MAX_RESULTS = 60;

const equipLabel = (e: Equipment) => [e.brand, e.series, e.name].filter(Boolean).join(' ');

export default function BestInClassPicker({
	category,
	equipment,
	currentEquipmentId,
	saving,
	onClose,
	onConfirm
}: Props) {
	const [query, setQuery] = useState('');
	const [brand, setBrand] = useState('');
	const [selectedId, setSelectedId] = useState<number | null>(currentEquipmentId ?? null);
	const [showAll, setShowAll] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [onClose]);

	const all = useMemo(() => equipment ?? [], [equipment]);

	const inCategory = useMemo(
		() => all.filter((e) => matchesBestInClassCategory(e, category)),
		[all, category]
	);
	// If nothing is mapped to this category yet, don't strand the user on an empty list.
	const scoped = showAll || inCategory.length === 0 ? all : inCategory;

	const brands = useMemo(
		() => [...new Set(scoped.map((e) => e.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
		[scoped]
	);

	const filtered = scoped.filter(
		(e) =>
			matchesSearch(query, e.brand, e.series, e.name, e.exercise?.name) && (!brand || e.brand === brand)
	);
	const shown = filtered.slice(0, MAX_RESULTS);
	const selected = all.find((e) => e.id === selectedId) ?? null;
	const unchanged = selectedId !== null && selectedId === currentEquipmentId;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="bic-picker-title"
		>
			<button
				type="button"
				aria-label="Close"
				tabIndex={-1}
				onClick={onClose}
				className="absolute inset-0 cursor-default bg-black/35"
			/>

			<div className="bg-bg relative flex h-[calc(100dvh-2.75rem)] w-full flex-col rounded-t-[28px] shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.35)] lg:h-[min(780px,90vh)] lg:max-w-4xl lg:rounded-[28px] lg:shadow-2xl">
				{/* Header */}
				<div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5">
					<div className="min-w-0">
						<h2 id="bic-picker-title" className="text-main text-[22px] font-semibold tracking-tight">
							Best in class
						</h2>
						<p className="text-sub truncate text-[13px]">
							Pick your best <span className="text-main font-medium">{category.name}</span>
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="text-sub hover:text-main flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Search + filters */}
				<div className="border-border flex shrink-0 flex-col gap-3 border-b px-5 pb-3">
					<div className="flex gap-2.5">
						<div className="bg-surface focus-within:ring-accent flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3.5 focus-within:ring-2">
							<Search className="text-sub h-4 w-4 shrink-0" />
							<label className="sr-only" htmlFor="bic-machine-search">
								Search machines
							</label>
							<input
								id="bic-machine-search"
								type="search"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search by machine, brand or exercise"
								autoComplete="off"
								className="text-main placeholder:text-sub min-w-0 flex-1 bg-transparent text-base outline-none md:text-[15px]"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery('')}
									aria-label="Clear search"
									className="bg-sub/40 text-bg flex h-5.5 w-5.5 items-center justify-center rounded-full"
								>
									<X className="h-3 w-3" />
								</button>
							)}
						</div>
						<label className="sr-only" htmlFor="bic-brand-filter">
							Brand
						</label>
						<select
							id="bic-brand-filter"
							value={brand}
							onChange={(e) => setBrand(e.target.value)}
							className="border-border bg-bg text-main h-12 max-w-36 rounded-xl border px-3 text-sm sm:max-w-44"
						>
							<option value="">Brand: Any</option>
							{brands.map((b) => (
								<option key={b} value={b}>
									{b}
								</option>
							))}
						</select>
					</div>

					{inCategory.length > 0 && (
						<div className="bg-main/5 flex w-fit items-center rounded-xl p-1">
							<button
								type="button"
								onClick={() => setShowAll(false)}
								className={cn(
									'rounded-lg px-3 py-1 text-xs font-medium transition',
									!showAll ? 'bg-main text-bg' : 'text-sub hover:text-main'
								)}
							>
								{category.name} · {inCategory.length}
							</button>
							<button
								type="button"
								onClick={() => setShowAll(true)}
								className={cn(
									'rounded-lg px-3 py-1 text-xs font-medium transition',
									showAll ? 'bg-main text-bg' : 'text-sub hover:text-main'
								)}
							>
								All machines · {all.length}
							</button>
						</div>
					)}
				</div>

				{/* Machines */}
				<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
					{equipment === null ? (
						<p className="text-sub flex items-center gap-2 py-6 text-sm">
							<Loader2 className="h-4 w-4 animate-spin" /> Loading machines…
						</p>
					) : (
						<>
							{inCategory.length === 0 && !showAll && (
								<p className="text-sub pb-3 text-xs">
									No machines are tagged as {category.name} yet, so showing everything.
								</p>
							)}
							<ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
								{shown.map((item) => {
									const isSelected = item.id === selectedId;
									const isCurrent = item.id === currentEquipmentId;
									const eyebrow = [item.brand, item.series].filter(Boolean).join(' ');
									return (
										<li key={item.id}>
											<button
												type="button"
												onClick={() => setSelectedId(item.id)}
												aria-pressed={isSelected}
												aria-label={`${isSelected ? 'Selected' : 'Select'} ${equipLabel(item)}`}
												className={cn(
													'group bg-surface relative flex h-full w-full flex-col overflow-hidden rounded-[22px] text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.25)] active:translate-y-0 active:scale-[0.985]',
													isSelected ? 'ring-accent ring-2' : 'ring-border/70 ring-1'
												)}
											>
												<div className="from-surface to-sub-alt relative flex aspect-[5/4] w-full items-center justify-center bg-linear-to-b">
													<div className="bg-main/[0.07] pointer-events-none absolute inset-x-[18%] inset-y-[14%] rounded-full blur-2xl" />
													{item.image_url ? (
														<Image
															src={item.image_url}
															alt=""
															fill
															sizes="(max-width: 720px) 50vw, 240px"
															className="object-contain p-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
														/>
													) : (
														<Dumbbell className="text-sub h-9 w-9 opacity-30" />
													)}

													{isCurrent && (
														<span className="bg-bg/80 text-main ring-border/60 absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 backdrop-blur-md">
															<span className="bg-accent h-1.5 w-1.5 rounded-full" />
															Current pick
														</span>
													)}

													<span
														aria-hidden="true"
														className={cn(
															'absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full transition',
															isSelected
																? 'bg-accent text-bg'
																: 'bg-bg/80 text-transparent ring-border ring-1 backdrop-blur-md'
														)}
													>
														<Check className="h-3.5 w-3.5" strokeWidth={3} />
													</span>
												</div>

												<div className="bg-bg border-border/60 flex min-w-0 flex-1 flex-col border-t px-3.5 pb-3.5 pt-3">
													{eyebrow && <div className="text-sub truncate text-[11px] font-medium">{eyebrow}</div>}
													<div className="text-main mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
														{item.name || equipLabel(item)}
													</div>
													<div className="text-sub mt-auto pt-1.5 text-xs">
														{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
													</div>
												</div>
											</button>
										</li>
									);
								})}
							</ul>

							{filtered.length > MAX_RESULTS && (
								<p className="text-sub pt-3 text-xs">
									Showing {MAX_RESULTS} of {filtered.length}. Search or filter to narrow it down.
								</p>
							)}
							{filtered.length === 0 && (
								<p className="text-sub py-2 text-sm">No machines match{query ? ` “${query}”` : ''}.</p>
							)}
						</>
					)}
				</div>

				{/* Confirm bar */}
				<div className="border-border flex shrink-0 items-center justify-between gap-3 border-t px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
					<p className="text-sub min-w-0 truncate text-sm">
						{selected ? (
							<>
								<span className="text-main font-medium">{equipLabel(selected)}</span>
							</>
						) : (
							'Tap a machine to choose it'
						)}
					</p>
					<button
						type="button"
						onClick={() => selectedId !== null && onConfirm(selectedId)}
						disabled={selectedId === null || unchanged || saving}
						className={cn(
							'flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition disabled:cursor-not-allowed',
							selectedId !== null && !unchanged ? 'bg-main text-bg hover:opacity-90' : 'bg-sub-alt text-sub'
						)}
					>
						{saving && <Loader2 className="h-4 w-4 animate-spin" />}
						{saving ? 'Saving…' : unchanged ? 'Current pick' : 'Set as best in class'}
					</button>
				</div>
			</div>
		</div>
	);
}
