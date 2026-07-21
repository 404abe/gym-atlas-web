'use client';

import { useEffect, useState } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { fetchLeaderboard } from '@/lib/api';
import type { LeaderboardEntry } from '@/types/leaderboard';
import { PANEL_CLS, PANEL_LABEL_CLS } from './panelStyles';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'] });
const mono = jetbrainsMono.className;

const TOP_N = 5;

// "12 gyms · 40 machines · 8 links" — only the categories they actually
// contributed to, so a gyms-only contributor doesn't read as "0 machines".
function breakdown(entry: LeaderboardEntry): string {
	const parts: string[] = [];
	const push = (value: string, singular: string, plural: string) => {
		const count = Number(value);
		if (count > 0) parts.push(`${count} ${count === 1 ? singular : plural}`);
	};
	push(entry.gyms_added, 'gym', 'gyms');
	push(entry.equipment_added, 'machine', 'machines');
	push(entry.equipment_linked, 'link', 'links');
	push(entry.photos_added, 'photo', 'photos');
	return parts.join(' · ');
}

// Mirrors the real row's geometry (rank / 40px avatar / two text lines / score)
// so the panel doesn't reflow when the leaderboard lands.
function SkeletonRows() {
	return (
		<ul className="mt-5 flex flex-1 animate-pulse flex-col justify-between gap-3" aria-hidden="true">
			{Array.from({ length: TOP_N }).map((_, index) => (
				<li key={index} className="flex items-center gap-4">
					<span className="bg-border h-3 w-6 shrink-0 rounded" />
					<span className="bg-border h-10 w-10 shrink-0 rounded-full" />
					<span className="flex-1 space-y-2">
						<span className="bg-border block h-3 w-32 rounded" />
						<span className="bg-border block h-2.5 w-48 rounded" />
					</span>
					<span className="bg-border h-3 w-10 shrink-0 rounded" />
				</li>
			))}
		</ul>
	);
}

export default function CommunityPanel() {
	// null = still loading, [] = loaded but nothing to show (empty or failed).
	const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetchLeaderboard()
			.then((entries) => {
				if (cancelled) return;
				const top = [...entries]
					.sort((a, b) => Number(b.total_contributions) - Number(a.total_contributions))
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

	return (
		<div className={PANEL_CLS}>
			<div className="border-border flex shrink-0 items-center justify-between border-b pb-4">
				<span className={`${mono} ${PANEL_LABEL_CLS}`}>Top contributors</span>
				{rows !== null && rows.length > 0 && (
					<span className={`${mono} text-sub text-[10px]`}>Top {rows.length}</span>
				)}
			</div>

			{rows === null ? (
				<SkeletonRows />
			) : rows.length === 0 ? (
				<p className="text-sub mt-5 text-sm">No contributions yet</p>
			) : (
				<ul className="mt-5 flex flex-1 flex-col justify-between gap-3">
					{rows.map((entry, index) => (
						<li key={entry.id} className="flex items-center gap-4">
							<span className={`${mono} text-sub w-6 shrink-0 text-xs`}>
								{String(index + 1).padStart(2, '0')}
							</span>
							{/* <span className="border-border text-sub grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-semibold">
								{entry.username.charAt(0).toUpperCase()}
							</span> */}
							<div className="min-w-0 flex-1">
								<p className="text-main truncate text-sm font-medium">{entry.username}</p>
								<p className="text-sub mt-0.5 truncate text-xs">{breakdown(entry)}</p>
							</div>
							<span className={`${mono} text-accent shrink-0 text-sm`}>
								+{Number(entry.total_contributions)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
