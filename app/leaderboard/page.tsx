'use client';

import { useEffect, useState } from 'react';
import { Trophy, Building2, Dumbbell, Link as LinkIcon, Medal, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { fetchLeaderboard } from '@/lib/api';
import { LeaderboardEntry } from '@/types/leaderboard';

type SortKey = 'total' | 'gyms' | 'equipment' | 'linked' | 'photos';

export default function LeaderboardPage() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<SortKey>('total');

	useEffect(() => {
		const load = async () => {
			try {
				const data = await fetchLeaderboard();
				setLeaderboard(data);
			} catch (err) {
				console.error('Failed to fetch leaderboard:', err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const sorted = [...leaderboard].sort((a, b) => {
		if (sortBy === 'gyms') return parseInt(b.gyms_added) - parseInt(a.gyms_added);
		if (sortBy === 'equipment') return parseInt(b.equipment_added) - parseInt(a.equipment_added);
		if (sortBy === 'linked') return parseInt(b.equipment_linked) - parseInt(a.equipment_linked);
		if (sortBy === 'photos') return parseInt(b.photos_added) - parseInt(a.photos_added);
		return parseInt(b.total_contributions) - parseInt(a.total_contributions);
	});

	const totalGyms = leaderboard.reduce((s, e) => s + parseInt(e.gyms_added), 0);
	const totalMachines = leaderboard.reduce((s, e) => s + parseInt(e.equipment_added), 0);
	const totalLinks = leaderboard.reduce((s, e) => s + parseInt(e.equipment_linked), 0);
	const totalPhotos = leaderboard.reduce((s, e) => s + parseInt(e.photos_added), 0);

	const rankStyle = (rank: number) => {
		if (rank === 1) return 'bg-amber-400/20 text-amber-400';
		if (rank === 2) return 'bg-main/10 text-sub';
		if (rank === 3) return 'bg-orange-400/20 text-orange-400';
		return 'bg-sub-alt text-sub';
	};

	if (loading) return <div className="text-sub p-8 text-sm">Loading leaderboard...</div>;

	return (
		<div id="page-leaderboard" className="content-grid py-8">
			{/* Header */}
			<div className="mb-6 flex items-start justify-between gap-4">
				<div>
					<div className="mb-1 flex items-center gap-2">
						<Trophy className="text-main h-5 w-5" />
						<h1 className="text-main text-xl font-medium">Leaderboard</h1>
					</div>
					<p className="text-sub text-sm">Top contributors to the GymAtlas database</p>
				</div>
				<Medal className="text-sub h-8 w-8 shrink-0 opacity-40" />
			</div>

			{/* Community stats */}
			<div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
				<span className="text-sub">
					{totalGyms + totalMachines + totalLinks} total contributions
				</span>
				<span className="text-main font-medium">{leaderboard.length} contributors</span>
				<span className="text-sub">{totalGyms} gyms</span>
				<span className="text-sub">{totalMachines} machines</span>
				<span className="text-sub">{totalLinks} linked</span>
				<span className="text-sub">{totalPhotos} photos</span>
			</div>

			{/* Sort toggle */}
			<div className="bg-sub-alt mb-4 flex w-fit shrink-0 gap-0.5 rounded-lg p-1">
				{(
					[
						{ key: 'total', label: 'Total' },
						{ key: 'gyms', label: 'Gyms' },
						{ key: 'equipment', label: 'Machines' },
						{ key: 'linked', label: 'Linked' },
						{ key: 'photos', label: 'Photos' }
					] as { key: SortKey; label: string }[]
				).map(({ key, label }) => (
					<button
						key={key}
						onClick={() => setSortBy(key)}
						className={`rounded-md px-3 py-1 text-sm transition ${
							sortBy === key ? 'bg-main text-bg' : 'text-sub hover:text-main'
						}`}
					>
						{label}
					</button>
				))}
			</div>

			{/* List */}
			{sorted.length === 0 ? (
				<div className="bg-surface rounded-2xl p-8 text-center">
					<p className="text-sub text-sm">No contributions yet</p>
				</div>
			) : (
				<div className="space-y-2">
					{sorted.map((entry, index) => {
						const rank = index + 1;
						const total = parseInt(entry.total_contributions);
						const gyms = parseInt(entry.gyms_added);
						const equipment = parseInt(entry.equipment_added);
						const linked = parseInt(entry.equipment_linked);
						const photos = parseInt(entry.photos_added);
						const scoreMap = { total, gyms, equipment, linked, photos };
						const labelMap: Record<SortKey, string> = {
							total: 'total',
							gyms: 'gyms',
							equipment: 'machines',
							linked: 'links',
							photos: 'photos'
						};

						return (
							<Link
								key={entry.id}
								id={`leaderboard-entry-${entry.id}`}
								href={`/profile/${entry.username}`}
								className="bg-surface flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-colors"
							>
								{/* Rank */}
								<div
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-medium ${rankStyle(rank)}`}
								>
									{rank}
								</div>

								{/* User info */}
								<div className="min-w-0 flex-1">
									<p className="text-main text-sm font-medium">{entry.username}</p>
									<div className="text-sub mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
										{gyms > 0 && (
											<span className="flex items-center gap-1">
												<Building2 className="h-3 w-3" />
												{gyms} {gyms === 1 ? 'gym' : 'gyms'}
											</span>
										)}
										{equipment > 0 && (
											<span className="flex items-center gap-1">
												<Dumbbell className="h-3 w-3" />
												{equipment} {equipment === 1 ? 'machine' : 'machines'}
											</span>
										)}
										{linked > 0 && (
											<span className="flex items-center gap-1">
												<LinkIcon className="h-3 w-3" />
												{linked} {linked === 1 ? 'link' : 'links'}
											</span>
										)}
										{photos > 0 && (
											<span className="flex items-center gap-1">
												<ImageIcon className="h-3 w-3" />
												{photos} {photos === 1 ? 'photo' : 'photos'}
											</span>
										)}
									</div>
								</div>

								{/* Score */}
								<div className="bg-main/10 text-main shrink-0 rounded-lg px-3 py-1.5 text-center">
									<p className="text-[10px] font-medium uppercase tracking-wide">{labelMap[sortBy]}</p>
									<p className="text-lg font-medium">{scoreMap[sortBy]}</p>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
