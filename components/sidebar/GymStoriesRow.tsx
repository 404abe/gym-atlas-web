'use client';
import { useEffect, useRef } from 'react';
import { Dumbbell } from 'lucide-react';
import Image from 'next/image';
import { Gym } from '@/types/gym';

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

/**
 * Horizontally-scrolling "stories" row of circular gym avatars.
 * Mobile-only — render inside a `md:hidden` region. Sorts by distance when a
 * user location is available and scrolls the selected gym into view.
 */
export default function GymStoriesRow({
	gyms,
	selectedGym,
	onSelectGym,
	userLocation,
	className = ''
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	userLocation: { lat: number; lng: number } | null;
	className?: string;
}) {
	const railRef = useRef<HTMLDivElement>(null);

	const sortedGyms = userLocation
		? [...gyms].sort((a, b) => {
				if (!a.lat || !a.lng) return 1;
				if (!b.lat || !b.lng) return -1;
				return (
					getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
					getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
				);
			})
		: gyms;

	useEffect(() => {
		if (!selectedGym || !railRef.current) return;
		const btn = railRef.current.querySelector(`[data-gym-id="${selectedGym.id}"]`);
		btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
	}, [selectedGym]);

	if (sortedGyms.length === 0) return null;

	return (
		<div
			ref={railRef}
			className={`flex gap-2.5 overflow-x-auto px-3 pb-3 pt-1 ${className}`}
			style={{ scrollbarWidth: 'none' }}
		>
			{sortedGyms.map((gym) => (
				<button
					key={gym.id}
					data-gym-id={gym.id}
					onClick={() => onSelectGym(gym)}
					className="flex shrink-0 flex-col items-center gap-1"
				>
					<div
						className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[2.5px] ${
							selectedGym?.id === gym.id ? 'border-main' : 'border-border'
						} bg-sub-alt`}
					>
						{gym.image_url ? (
							<Image src={gym.image_url} alt={gym.name} fill sizes="48px" className="object-cover" />
						) : (
							<Dumbbell size={18} className="text-sub" />
						)}
					</div>
					<span className="max-w-13 truncate text-[9px] leading-tight text-sub">{gym.name}</span>
				</button>
			))}
		</div>
	);
}
