'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { fetchGyms } from '@/lib/api';
import type { Gym } from '@/types/gym';
import { PANEL_CLS, PANEL_LABEL_CLS } from './panelStyles';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

const TOP_N = 8;

// Mirrors the real row's geometry (name / city / bar / count widths) so the
// panel doesn't reflow when the gym list lands.
function SkeletonRows() {
	return (
		<ul className="mt-5 flex flex-1 animate-pulse flex-col justify-between gap-3" aria-hidden="true">
			{Array.from({ length: TOP_N }).map((_, index) => (
				<li key={index} className="flex items-center gap-4">
					<span className="bg-border h-3 w-40 rounded" />
					<span className="bg-border h-3 w-24 rounded" />
					<span className="bg-border h-1.5 flex-1 rounded-full" />
					<span className="bg-border h-3 w-6 rounded" />
				</li>
			))}
		</ul>
	);
}

export default function DatabasePanel() {
	// null = still loading, [] = loaded but nothing to show (empty or failed).
	const [rows, setRows] = useState<Gym[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetchGyms()
			.then((gyms) => {
				if (cancelled) return;
				const top = [...gyms]
					.sort((a, b) => Number(b.total_equipment) - Number(a.total_equipment))
					.slice(0, TOP_N);
				setRows(top);
			})
			.catch(() => {
				if (!cancelled) setRows([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const maxCount = rows && rows.length > 0 ? Number(rows[0].total_equipment) : 0;

	return (
		<div className={PANEL_CLS}>
			<div className="border-border flex shrink-0 items-center justify-between border-b pb-4">
				<span className={`${mono} ${PANEL_LABEL_CLS}`}>Gym</span>
				<span className={`${mono} ${PANEL_LABEL_CLS}`}>Machines</span>
			</div>

			{rows === null ? (
				<SkeletonRows />
			) : rows.length === 0 ? (
				<p className="text-sub mt-5 text-sm">No gyms yet</p>
			) : (
				<ul className="mt-5 flex flex-1 flex-col justify-between gap-3">
					{rows.map((gym) => {
						const count = Number(gym.total_equipment);
						const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
						return (
							<li key={gym.id} className="flex items-center gap-4">
								<span className="text-main w-40 shrink-0 truncate text-sm">{gym.name}</span>
								<span className={`${mono} text-sub w-24 shrink-0 truncate text-[11px]`}>
									{gym.city || '—'}
								</span>
								<span className="bg-border relative h-1.5 flex-1 overflow-hidden rounded-full">
									<span
										className="bg-accent absolute inset-y-0 left-0 rounded-full"
										style={{ width: `${pct}%` }}
									/>
								</span>
								<span className={`${mono} text-main w-6 shrink-0 text-right text-xs`}>{count}</span>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
