//data/GymTable.tsx
'use client';

import { ChevronUp, ChevronDown, Search, Building2, MapPin, Heart, Plus } from 'lucide-react';
import { FaExpandAlt } from 'react-icons/fa';
import Image from 'next/image';
import RatingStars from '@/components/ui/RatingStars';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useRouter } from 'next/navigation';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { Gym } from '@/types/gym';

type GymTableProps = {
	gyms: Gym[];
	viewMode: 'expanded' | 'compact';
	sortField: string;
	sortDirection: 'asc' | 'desc';
	onSort: (field: string) => void;
	hasSearch: boolean;
	onClearSearch: () => void;
	onRateGym?: (id: number, rating: number) => void;
	onToggleFavorite?: (id: number) => void;
};

export default function GymTable({
	gyms,
	viewMode,
	sortField,
	sortDirection,
	onSort,
	hasSearch,
	onClearSearch,
	onRateGym,
	onToggleFavorite
}: GymTableProps) {
	const router = useRouter();
	const { requireAuth } = useAuthGate();

	const SortIcon = ({ field }: { field: string }) =>
		sortField === field ? (
			sortDirection === 'asc' ? (
				<ChevronUp className="h-3 w-3" />
			) : (
				<ChevronDown className="h-3 w-3" />
			)
		) : null;

	if (gyms.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<div className="bg-sub-alt mb-3 rounded-full p-4">
					<Search className="text-sub h-8 w-8" />
				</div>
				<p className="text-sub text-sm">No gyms found</p>

				{hasSearch ? (
					<button
						onClick={onClearSearch}
						className="text-sub hover:text-text mt-4 text-sm underline"
					>
						Clear search
					</button>
				) : (
					<button
						onClick={() => requireAuth('add a gym') && router.push('/add')}
						className="bg-main text-bg mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition hover:opacity-90"
					>
						<Plus className="h-3.5 w-3.5" />
						Add new gym
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="w-full overflow-x-auto">
			<table className="w-full table-auto border-separate border-spacing-y-1">
				{/* Header — hidden in expanded mode */}
				<thead className={`sticky top-0 ${viewMode === 'expanded' ? 'hidden' : ''}`}>
					<tr className="text-sub text-left text-xs font-medium">
						<th className="w-8 px-2 py-3 sm:w-12 sm:px-4">
							<Heart className="h-3.5 w-3.5" />
						</th>
						<th
							onClick={() => onSort('name')}
							className="hover:text-main cursor-pointer px-2 py-3 sm:px-4"
						>
							<div className="flex items-center gap-1">
								Gym <SortIcon field="name" />
							</div>
						</th>
						<th className="hidden px-2 py-3 md:table-cell md:px-4">Location</th>
						<th
							onClick={() => onSort('total_equipment')}
							className="hover:text-main hidden cursor-pointer px-2 py-3 sm:table-cell sm:px-4"
						>
							<div className="flex items-center gap-1">
								Equipment <SortIcon field="total_equipment" />
							</div>
						</th>
						<th
							onClick={() => onSort('unique_machines')}
							className="hover:text-main hidden cursor-pointer px-2 py-3 lg:table-cell lg:px-4"
						>
							<div className="flex items-center gap-1">
								Unique <SortIcon field="unique_machines" />
							</div>
						</th>
						<th
							onClick={() => onSort('avg_rating')}
							className="hover:text-main cursor-pointer px-2 py-3 sm:px-4"
						>
							<div className="flex items-center gap-1">
								Rating <SortIcon field="avg_rating" />
							</div>
						</th>
						<th className="hidden px-2 py-3 sm:table-cell sm:px-4">Favourites</th>
						<th className="w-8 px-2 py-3" />
					</tr>
				</thead>

				<tbody
					className={
						viewMode === 'compact'
							? '[&>tr:nth-child(odd)>td]:bg-sub-alt [&>tr>td:first-child]:rounded-l-xl [&>tr>td:last-child]:rounded-r-xl'
							: ''
					}
				>
					{gyms.map((gym, index) =>
						viewMode === 'expanded' ? (
							<tr key={gym.id}>
								<td colSpan={8} className="px-2 py-1">
									<div
										className={`flex items-center gap-3 rounded-xl px-4 py-3 ${index % 2 === 0 ? 'bg-sub-alt' : ''}`}
									>
										{/* Gym image */}
										<div className="bg-main/5 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
											{gym.image_url ? (
												<Image
													src={gym.image_url}
													alt={gym.name}
													fill
													sizes="56px"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<Building2 className="text-sub h-5 w-5 opacity-40" />
												</div>
											)}
										</div>

										{/* Info */}
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-main text-sm font-semibold">{gym.name}</p>
												{gym.total_equipment != null && (
													<span className="bg-main/10 text-sub inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
														{gym.total_equipment} items
													</span>
												)}
												{gym.unique_machines != null && (
													<span className="bg-main/10 text-sub hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex">
														{gym.unique_machines} unique
													</span>
												)}
											</div>
											<div className="text-sub mt-0.5 flex items-center gap-1 text-xs">
												<MapPin className="h-3 w-3 shrink-0" />
												<span>{[gym.city, gym.country].filter(Boolean).join(', ')}</span>
											</div>
										</div>

										{/* Rating — hidden on mobile */}
										<div className="hidden shrink-0 sm:block">
											<RatingStars
												avgRating={Number(gym.avg_rating) || 0}
												userRating={Number(gym.user_rating) || undefined}
												onRate={(rating) => onRateGym?.(gym.id, rating)}
											/>
										</div>

										{/* Rating number — mobile only */}
										<div className="text-sub shrink-0 text-sm sm:hidden">
											{gym.avg_rating ? Number(gym.avg_rating).toFixed(1) : '—'}
										</div>

										{/* Actions */}
										<div className="flex shrink-0 items-center gap-1">
											<FavoriteButton
												isFavorite={gym.is_favorite ?? false}
												onToggle={() => onToggleFavorite?.(gym.id)}
											/>
											<button
												onClick={() => router.push(`/gyms/${gym.id}`)}
												aria-label="View gym"
												className="text-sub hover:text-main flex items-center justify-center rounded-lg p-1 transition"
											>
												<FaExpandAlt className="h-3.5 w-3.5" />
											</button>
										</div>
									</div>
								</td>
							</tr>
						) : (
							// Compact row
							<tr key={gym.id} className="group cursor-pointer transition-colors">
								<td className="px-2 py-3 sm:px-4">
									<FavoriteButton
										isFavorite={gym.is_favorite ?? false}
										onToggle={() => onToggleFavorite?.(gym.id)}
									/>
								</td>
								<td className="px-2 py-3 sm:px-4" onClick={() => router.push(`/gyms/${gym.id}`)}>
									<div className="flex items-center gap-2">
										<Building2 className="text-sub h-4 w-4 shrink-0" />
										<div>
											<span className="text-text text-sm font-medium">{gym.name}</span>
											{(gym.city || gym.country) && (
												<p className="text-sub mt-0.5 flex items-center gap-1 text-xs md:hidden">
													<MapPin className="h-3 w-3" />
													{[gym.city, gym.country].filter(Boolean).join(', ')}
												</p>
											)}
										</div>
									</div>
								</td>
								<td className="hidden px-2 py-3 md:table-cell md:px-4">
									<div className="flex items-center gap-1.5">
										<MapPin className="text-sub h-3 w-3" />
										<span className="text-sub text-sm">
											{[gym.city, gym.country].filter(Boolean).join(', ')}
										</span>
									</div>
								</td>
								<td className="hidden px-2 py-3 sm:table-cell sm:px-4">
									<span className="bg-main/10 text-sub inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
										{gym.total_equipment || 0} items
									</span>
								</td>
								<td className="hidden px-2 py-3 lg:table-cell lg:px-4">
									<span className="bg-main/10 text-sub inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
										{gym.unique_machines || 0} unique
									</span>
								</td>
								<td className="px-2 py-3 sm:px-4">
									<span className="text-sub text-sm sm:hidden">
										{gym.avg_rating ? Number(gym.avg_rating).toFixed(1) : '—'}
									</span>
									<span className="hidden sm:block">
										<RatingStars
											avgRating={Number(gym.avg_rating) || 0}
											userRating={Number(gym.user_rating) || undefined}
											onRate={(rating) => onRateGym?.(gym.id, rating)}
										/>
									</span>
								</td>
								<td className="hidden px-2 py-3 sm:table-cell sm:px-4">
									<div className="flex items-center gap-1">
										<Heart
											className={`h-3.5 w-3.5 ${gym.favourites ? 'fill-red-500 text-red-500' : 'text-sub'}`}
										/>
										<span className="text-sub text-sm">{gym.favourites || 0}</span>
									</div>
								</td>
								<td className="px-2 py-3 sm:px-4">
									<button
										onClick={() => router.push(`/gyms/${gym.id}`)}
										aria-label="View gym"
										className="text-sub hover:text-main flex items-center justify-center rounded-lg p-1 transition"
									>
										<FaExpandAlt className="h-3.5 w-3.5" />
									</button>
								</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</div>
	);
}
