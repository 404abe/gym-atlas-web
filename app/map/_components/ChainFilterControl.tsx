'use client';

import { Building2, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChainWithCount } from '@/lib/api';
import { chainFilterCount, isChainFilterActive, type ChainFilterState } from '@/lib/chain-filter';
import { cn } from '@/lib/utils';

/**
 * Pill on the map that opens a small panel: a master "Independent gyms only"
 * switch, and one checkbox per chain. A ticked chain is shown, an unticked one is
 * hidden. While the master switch is on the per-chain boxes are locked and read
 * as unticked, since every chain is hidden; switching it off brings back whatever
 * the user had chosen before.
 */
export default function ChainFilterControl({
	chains,
	state,
	onIndependentOnlyChange,
	onToggleChain,
	onReset,
	className
}: {
	chains: ChainWithCount[];
	state: ChainFilterState;
	onIndependentOnlyChange: (value: boolean) => void;
	onToggleChain: (slug: string) => void;
	onReset: () => void;
	/** Positioning is the caller's job, so the control can move with the map layout. */
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const active = isChainFilterActive(state);
	const count = chainFilterCount(state);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	return (
		<div ref={rootRef} className={cn('pointer-events-auto', className)}>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-expanded={open}
				aria-haspopup="dialog"
				aria-label={active ? `Chain filter, ${count} active` : 'Chain filter'}
				className={cn(
					'border-border bg-bg hover:border-sub relative flex h-9 items-center gap-2 rounded-full border px-2.5 text-[12px] shadow-lg transition sm:px-3',
					active ? 'text-main' : 'text-sub'
				)}
			>
				<Building2 size={15} className="shrink-0" />
				<span className="hidden sm:inline">Chains</span>
				{active && (
					<span className="bg-main text-bg flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
						{count}
					</span>
				)}
			</button>

			{open && (
				<div
					role="dialog"
					aria-label="Chain filter"
					className="border-border bg-bg absolute left-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl border p-2 shadow-lg"
				>
					<button
						type="button"
						role="switch"
						aria-checked={state.independentOnly}
						onClick={() => onIndependentOnlyChange(!state.independentOnly)}
						className="hover:bg-sub-alt flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition"
					>
						<span className="text-main text-[13px] font-medium">Independent gyms only</span>
						<span
							aria-hidden="true"
							className={cn(
								'relative h-5 w-9 shrink-0 rounded-full border transition',
								state.independentOnly ? 'border-main bg-main' : 'border-border bg-sub-alt'
							)}
						>
							<span
								className={cn(
									'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all',
									state.independentOnly ? 'bg-bg left-[18px]' : 'bg-sub left-0.5'
								)}
							/>
						</span>
					</button>

					{chains.length > 0 && (
						<>
							<div className="bg-border mx-2.5 my-1.5 h-px" />
							<p className="text-sub px-2.5 pb-1 pt-0.5 text-[10px] uppercase tracking-[0.14em]">
								Show chains
							</p>
							<ul className="m-0 max-h-56 list-none overflow-y-auto p-0">
								{chains.map((chain) => {
									const shown = !state.independentOnly && !state.hiddenChainSlugs.includes(chain.slug);
									return (
										<li key={chain.slug}>
											<button
												type="button"
												role="checkbox"
												aria-checked={shown}
												disabled={state.independentOnly}
												onClick={() => onToggleChain(chain.slug)}
												className="hover:bg-sub-alt flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
											>
												<span
													aria-hidden="true"
													className={cn(
														'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
														shown ? 'border-main bg-main text-bg' : 'border-border text-transparent'
													)}
												>
													<Check size={11} strokeWidth={3} />
												</span>
												<span className="text-main min-w-0 flex-1 truncate text-[13px]">{chain.name}</span>
												<span className="text-sub text-[11px] tabular-nums">{chain.approved_gym_count}</span>
											</button>
										</li>
									);
								})}
							</ul>
						</>
					)}

					{active && (
						<>
							<div className="bg-border mx-2.5 my-1.5 h-px" />
							<button
								type="button"
								onClick={onReset}
								className="text-sub hover:text-main hover:bg-sub-alt w-full rounded-xl px-2.5 py-1.5 text-left text-[12px] transition"
							>
								Show all gyms
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}
