'use client';

import { Gym } from '@/types/gym';
import { useAuth } from '@/app/contexts/AuthContext';
import { favouriteGym, unfavouriteGym } from '@/lib/api';
import { Heart, Star, Dumbbell, MapPin, Navigation, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)}m away`;
	return `${km.toFixed(1)}km away`;
}

export default function GymCard({
	gym,
	selected,
	onClick,
	userLocation
}: {
	gym: Gym;
	selected: boolean;
	onClick: () => void;
	userLocation?: { lat: number; lng: number } | null;
}) {
	const router = useRouter();
	const { user } = useAuth();
	const [favourited, setFavourited] = useState(gym.is_favorite ?? false);
	const [favouriteCount, setFavouriteCount] = useState(gym.favourites ?? 0);

	const formatHearts = (n?: number) => {
		if (!n) return '0';
		if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
		return n.toString();
	};

	const handleHeartClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!user) {
			router.push('/login');
			return;
		}

		const nextFavourited = !favourited;
		setFavourited(nextFavourited);
		setFavouriteCount((count) => Math.max(0, count + (nextFavourited ? 1 : -1)));

		try {
			if (nextFavourited) await favouriteGym(gym.id);
			else await unfavouriteGym(gym.id);
		} catch (err) {
			console.error('Failed to toggle gym favourite:', err);
			setFavourited(favourited);
			setFavouriteCount((count) => Math.max(0, count + (nextFavourited ? -1 : 1)));
		}
	};

	const handleCardClick = () => {
		onClick();
	};

	const distance =
		userLocation && gym.lat && gym.lng
			? getDistanceKm(userLocation.lat, userLocation.lng, gym.lat, gym.lng)
			: null;

	return (
		<div
			id={`gym-card-${gym.id}`}
			onClick={handleCardClick}
			className={`cursor-pointer rounded-xl px-3 py-3 transition-colors duration-[--default-transition-duration] ${
				selected ? 'bg-sub-alt' : 'hover:bg-surface'
			}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					{/* Name + profile link */}
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/gyms/${gym.id}`);
							}}
							className="text-text min-w-0 truncate text-left text-sm font-medium transition hover:text-main"
						>
							{gym.name}
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								router.push(`/gyms/${gym.id}`);
							}}
							aria-label="View gym profile"
							className="text-sub hover:text-main shrink-0 transition"
						>
							<ArrowRight className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Location + distance */}
					<div className="text-sub mt-0.5 flex flex-wrap items-center gap-2.5">
						{gym.city && (
							<div className="flex items-center gap-1">
								<MapPin className="h-3 w-3 shrink-0" />
								<span className="text-xs">{gym.city}</span>
							</div>
						)}
						{distance !== null && (
							<div className="flex items-center gap-1">
								<Navigation className="h-3 w-3 shrink-0" />
								<span className="text-xs">{formatDistance(distance)}</span>
							</div>
						)}
					</div>

					{/* Stats + rating row */}
					<div className="mt-2 flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-1">
							<Dumbbell className="text-sub h-3.5 w-3.5 shrink-0" />
							<span className="text-sub text-xs">
								{gym.total_equipment ?? 0} machines · {gym.unique_machines ?? 0} unique
							</span>
						</div>

						{gym.rating ? (
							<div className="flex items-center gap-1">
								<Star className="fill-accent stroke-accent h-3.5 w-3.5" />
								<span className="text-sub text-xs">{gym.rating}</span>
							</div>
						) : null}
					</div>
				</div>

				{/* Favourite */}
				<button
					id={`gym-card-${gym.id}-favourite-btn`}
					onClick={handleHeartClick}
					aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
					className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5"
				>
					<Heart
						size={15}
						className={`transition-all duration-[--default-transition-duration] ${
							favourited ? 'fill-red-500 stroke-red-500' : 'text-sub fill-none'
						}`}
					/>
					<span className="text-sub text-xs">{formatHearts(favouriteCount)}</span>
				</button>
			</div>
		</div>
	);
}
