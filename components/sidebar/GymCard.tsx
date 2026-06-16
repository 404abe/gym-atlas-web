'use client';

import { Gym } from '@/types/gym';
import { useAuth } from '@/app/contexts/AuthContext';
import { favouriteGym, unfavouriteGym } from '@/lib/api';
import { Heart, Dumbbell, Navigation, ArrowRight, Clock, Building } from 'lucide-react';
import { getOpenStatus } from '@/lib/openingHours';
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

	const openStatus = getOpenStatus(gym.opening_hours);
	const images = gym.equipment_images ?? [];

	const distance =
		userLocation && gym.lat && gym.lng
			? getDistanceKm(userLocation.lat, userLocation.lng, gym.lat, gym.lng)
			: null;

	return (
		<div
			id={`gym-card-${gym.id}`}
			onClick={onClick}
			className={`cursor-pointer rounded-xl px-3 py-3 transition-colors duration-[--default-transition-duration] ${
				selected ? 'bg-sub-alt' : 'hover:bg-surface'
			}`}
		>
			{/* Header row: avatar + name/location + arrow */}
			<div className="flex items-start gap-2.5">
				<div className="bg-sub-alt border-border flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border">
					{gym.image_url ? (
						<img src={gym.image_url} alt={gym.name} className="h-full w-full object-cover" />
					) : (
						<Building className="text-sub h-5 w-5" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-text truncate text-sm font-semibold leading-tight">{gym.name}</p>
					<p className="text-sub mt-0.5 flex items-center gap-1 text-xs">
						<span>{gym.city ?? 'Gym'}</span>
						{distance !== null && (
							<>
								<span>·</span>
								<Navigation className="h-2.5 w-2.5 shrink-0" />
								<span>{formatDistance(distance)}</span>
							</>
						)}
					</p>
				</div>

				<button
					onClick={(e) => {
						e.stopPropagation();
						router.push(`/gyms/${gym.id}`);
					}}
					aria-label="View gym profile"
					className="bg-sub-alt text-sub hover:text-main shrink-0 rounded-md p-1 transition"
				>
					<ArrowRight className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Chips row */}
			<div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
				<span className="border-border text-sub flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
					<Dumbbell className="h-2.5 w-2.5" />
					{gym.total_equipment ?? 0}
				</span>

				{openStatus && (
					<span
						className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
							openStatus.status === 'open'
								? 'bg-[#0d2e1a] border-[#1a4a28] text-[#4ade80]'
								: openStatus.status === 'closing_soon'
									? 'bg-[#2a1a0d] border-[#4a2e10] text-[#fb923c]'
									: 'bg-[#2a1010] border-[#4a2020] text-[#f87171]'
						}`}
					>
						<Clock className="h-3 w-3 shrink-0" />
						<span>{openStatus.label}</span>
					</span>
				)}

				<button
					onClick={handleHeartClick}
					aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
					className="bg-sub-alt border-border text-sub flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
				>
					<Heart
						size={10}
						className={`transition-all duration-[--default-transition-duration] ${
							favourited ? 'fill-red-500 stroke-red-500' : 'fill-none'
						}`}
					/>
					{formatHearts(favouriteCount)}
				</button>
			</div>

			{/* Photo strip */}
			{images.length > 0 && (
				<div className="mt-2 flex gap-1.5" style={{ scrollbarWidth: 'none' }}>
					{images.slice(0, 3).map((src, i) => (
						<div key={i} className="bg-sub-alt h-16 w-16 shrink-0 overflow-hidden rounded-lg">
							<img src={src} alt="" className="h-full w-full object-cover brightness-105 contrast-105" />
						</div>
					))}
					{images.length > 3 && (
						<div className="bg-sub-alt flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-xs font-medium text-sub">
							+{images.length - 3}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
