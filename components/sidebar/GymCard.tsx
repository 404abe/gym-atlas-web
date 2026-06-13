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
			{/* Top row: thumbnail + name + arrow */}
			<div className="flex items-end gap-2.5">
				<div className="border-border bg-sub-alt flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
					{gym.image_url ? (
						<img src={gym.image_url} alt={gym.name} className="h-full w-full object-cover" />
					) : (
						<Dumbbell className="text-sub h-3.5 w-3.5" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<span className="text-sub text-xs leading-none">{gym.city ?? 'Gym'}</span>
					{distance !== null && (
						<p className="text-sub mt-0.5 flex items-center gap-0.5 text-xs">
							<Navigation className="h-2.5 w-2.5 shrink-0" />
							{formatDistance(distance)}
						</p>
					)}
				</div>

				{/* Arrow — top right */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						router.push(`/gyms/${gym.id}`);
					}}
					aria-label="View gym profile"
					className="border-border bg-sub-alt text-sub hover:text-main self-start shrink-0 rounded-md border p-1 transition"
				>
					<ArrowRight className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Gym name */}
			<p className="text-text mt-2.5 truncate text-sm font-semibold leading-tight">
				{gym.name}
			</p>

			{/* Tags */}
			<div className="mt-2 flex gap-1.5">
				<span className="border-border text-sub flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
					<Dumbbell className="h-2.5 w-2.5" />
					{gym.total_equipment ?? 0} machines
				</span>
				{gym.unique_machines > 0 && (
					<span className="border-border text-sub rounded-full border px-2 py-0.5 text-xs">
						{gym.unique_machines} unique
					</span>
				)}
			</div>

			{/* Bottom row: favourite + rating */}
			<div className="mt-2.5 flex items-center justify-between">
				<button
					id={`gym-card-${gym.id}-favourite-btn`}
					onClick={handleHeartClick}
					aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
					className="flex items-center gap-1"
				>
					<Heart
						size={13}
						className={`transition-all duration-[--default-transition-duration] ${
							favourited ? 'fill-red-500 stroke-red-500' : 'text-sub fill-none'
						}`}
					/>
					<span className="text-sub text-xs">{formatHearts(favouriteCount)}</span>
				</button>

				<div className="flex items-center gap-1">
					<Star
						className={`h-3 w-3 ${gym.rating ? 'fill-accent stroke-accent' : 'text-sub fill-none'}`}
					/>
					<span className="text-sub text-xs">{gym.rating ?? '—'}</span>
				</div>
			</div>
		</div>
	);
}
