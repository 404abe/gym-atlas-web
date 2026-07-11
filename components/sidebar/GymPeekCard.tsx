'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Clock, Heart, Navigation, Star } from 'lucide-react';
import { Gym } from '@/types/gym';
import { useAuth } from '@/app/contexts/AuthContext';
import { favouriteGym, unfavouriteGym } from '@/lib/api';
import { getOpenStatus } from '@/lib/openingHours';

const ACCENT = '#3ee7a6';

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
	if (km < 1) return `${Math.round(km * 1000)}m`;
	return `${km.toFixed(1)}km`;
}

function formatCount(n: number): string {
	if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
	return n.toString();
}

/**
 * Persistent / swipeable gym card shown at the bottom of the mobile map when a
 * gym is selected. Swipe down to dismiss. Mobile-only — render inside a
 * `md:hidden` region.
 */
export default function GymPeekCard({
	gym,
	userLocation,
	onDismiss
}: {
	gym: Gym;
	userLocation: { lat: number; lng: number } | null;
	onDismiss: () => void;
}) {
	const router = useRouter();
	const { user } = useAuth();
	const [favourited, setFavourited] = useState(gym.is_favorite ?? false);
	const [favouriteCount, setFavouriteCount] = useState(gym.favourites ?? 0);

	const cardRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{ x: number; y: number } | null>(null);

	const openStatus = getOpenStatus(gym.opening_hours);
	const distance =
		userLocation && gym.lat && gym.lng
			? getDistanceKm(userLocation.lat, userLocation.lng, gym.lat, gym.lng)
			: null;
	const rating = gym.avg_rating != null ? Number(gym.avg_rating) : null;

	const toggleFavourite = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!user) {
			router.push('/login');
			return;
		}
		const next = !favourited;
		setFavourited(next);
		setFavouriteCount((c) => Math.max(0, c + (next ? 1 : -1)));
		try {
			if (next) await favouriteGym(gym.id);
			else await unfavouriteGym(gym.id);
		} catch (err) {
			console.error('Failed to toggle gym favourite:', err);
			setFavourited(favourited);
			setFavouriteCount((c) => Math.max(0, c + (next ? -1 : 1)));
		}
	};

	const openDirections = () => {
		if (!gym.lat || !gym.lng) return;
		window.open(
			`https://www.google.com/maps/dir/?api=1&destination=${gym.lat},${gym.lng}`,
			'_blank',
			'noopener,noreferrer'
		);
	};

	// Swipe down to dismiss.
	const onTouchStart = (e: React.TouchEvent) => {
		dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		if (cardRef.current) cardRef.current.style.transition = 'none';
	};

	const onTouchMove = (e: React.TouchEvent) => {
		const start = dragRef.current;
		const el = cardRef.current;
		if (!start || !el) return;
		const dy = e.touches[0].clientY - start.y;
		if (dy > 0) el.style.transform = `translateY(${dy}px)`;
	};

	const onTouchEnd = (e: React.TouchEvent) => {
		const start = dragRef.current;
		const el = cardRef.current;
		if (!start || !el) return;
		dragRef.current = null;
		const dy = e.changedTouches[0].clientY - start.y;
		if (dy > 60) {
			el.style.transition = 'transform 0.22s ease';
			el.style.transform = 'translateY(120%)';
			setTimeout(onDismiss, 200);
			return;
		}
		el.style.transition = 'transform 0.2s ease';
		el.style.transform = '';
	};

	return (
		<div
			ref={cardRef}
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			className="rounded-2xl border border-border bg-surface p-3.5 shadow-lg"
		>
			{/* Header: avatar + name/distance + favourite toggle */}
			<div className="flex items-start gap-2.5">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-sub-alt">
					{gym.image_url ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={gym.image_url} alt={gym.name} className="h-full w-full object-cover" />
					) : (
						<Building className="h-5 w-5 text-sub" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold leading-tight text-text">{gym.name}</p>
					<p className="mt-0.5 flex items-center gap-1 text-xs text-sub">
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
					onClick={toggleFavourite}
					aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
					aria-pressed={favourited}
					className="shrink-0 rounded-lg bg-sub-alt p-2 text-sub transition hover:text-text"
				>
					<Heart
						size={15}
						className={`transition-all duration-[--default-transition-duration] ${
							favourited ? 'fill-red-500 stroke-red-500' : 'fill-none'
						}`}
					/>
				</button>
			</div>

			{/* Badges: open status · rating · likes */}
			<div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
				{openStatus && (
					<span
						className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
							openStatus.status === 'open'
								? 'border-[#1a4a28] bg-[#0d2e1a] text-[#4ade80]'
								: openStatus.status === 'closing_soon'
									? 'border-[#4a2e10] bg-[#2a1a0d] text-[#fb923c]'
									: 'border-[#4a2020] bg-[#2a1010] text-[#f87171]'
						}`}
					>
						<Clock className="h-3 w-3 shrink-0" />
						<span>{openStatus.label}</span>
					</span>
				)}
				<span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
					<Star className="h-3 w-3 shrink-0" />
					{rating != null ? rating.toFixed(1) : '—'}
				</span>
				<span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
					<Heart className="h-3 w-3 shrink-0" />
					{formatCount(favouriteCount)}
				</span>
			</div>

			{/* Actions: Directions (outlined) + View gym (filled teal) */}
			<div className="mt-3 flex gap-2">
				<button
					onClick={openDirections}
					className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-sub-alt py-2 text-xs font-medium text-text transition hover:border-sub"
				>
					<Navigation size={13} className="shrink-0" />
					Directions
				</button>
				<button
					onClick={() => router.push(`/gyms/${gym.id}`)}
					className="flex flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold text-bg transition active:brightness-95"
					style={{ backgroundColor: ACCENT }}
				>
					View gym
				</button>
			</div>
		</div>
	);
}
