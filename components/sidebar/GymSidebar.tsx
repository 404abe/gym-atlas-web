'use client';

import { Gym } from '@/types/gym';
import GymCard from './GymCard';
import { PanelLeftClose, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { cn } from '@/lib/utils';

const pillCls =
	'flex items-center bg-[var(--pill-bg)]  rounded-lg backdrop-blur pointer-events-auto';

export default function GymSidebar({
	gyms,
	selectedGym,
	onSelectGym,
	listOnly = false,
	gymSearch = '',
	onGymSearchChange,
	onCollapse
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	listOnly?: boolean;
	gymSearch?: string;
	onGymSearchChange?: (val: string) => void;
	onCollapse?: () => void;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const userLocation = useUserLocation();

	// The map filter highlights pins; it doesn't narrow the list. The sidebar
	// always reflects the gyms passed in (already text-filtered by the parent).
	const baseGyms = gyms;
	const displayGyms = useMemo(
		() =>
			userLocation
				? [...baseGyms].sort((a, b) => {
						if (!a.lat || !a.lng) return 1;
						if (!b.lat || !b.lng) return -1;
						const dist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
							const dLat = ((lat2 - lat1) * Math.PI) / 180;
							const dLng = ((lng2 - lng1) * Math.PI) / 180;
							const x =
								Math.sin(dLat / 2) ** 2 +
								Math.cos((lat1 * Math.PI) / 180) *
									Math.cos((lat2 * Math.PI) / 180) *
									Math.sin(dLng / 2) ** 2;
							return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
						};
						return (
							dist(userLocation.lat, userLocation.lng, a.lat, a.lng) -
							dist(userLocation.lat, userLocation.lng, b.lat, b.lng)
						);
					})
				: baseGyms,
		[baseGyms, userLocation]
	);

	useEffect(() => {
		if (!selectedGym) return;
		const idx = displayGyms.findIndex((g) => g.id === selectedGym.id);
		if (idx === -1) return;
		requestAnimationFrame(() => {
			scrollRef.current
				?.querySelector(`#gym-card-${selectedGym.id}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
	}, [displayGyms, selectedGym]);

	return (
		<div id="GymSidebar" className="flex h-full flex-col">
			{!listOnly && (
				<div className="shrink-0 p-3 pb-0">
					<div className={cn(pillCls, 'mb-2 gap-2 px-3 py-1.5')}>
						<Search size={13} className="shrink-0 text-sub" />
						<input
							type="text"
							placeholder="Search gyms..."
							value={gymSearch}
							onChange={(e) => onGymSearchChange?.(e.target.value)}
							className="min-w-0 flex-1 bg-transparent text-xs text-main placeholder:text-sub outline-none"
						/>
						{gymSearch ? (
							<button onClick={() => onGymSearchChange?.('')}>
								<X size={12} className="text-sub hover:text-main transition" />
							</button>
						) : (
							<span className="shrink-0 text-xs text-sub">{gyms.length} gyms</span>
						)}
						{onCollapse && (
							<button
								onClick={onCollapse}
								title="Collapse gym list"
								className="text-sub hover:text-main -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition hover:bg-sub-alt"
							>
								<PanelLeftClose size={13} />
							</button>
						)}
					</div>
				</div>
			)}

			{/* Scrollable cards */}
			<div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3 pt-0">
				<div className="space-y-1">
					{displayGyms.map((gym) => (
						<GymCard
							key={gym.id}
							gym={gym}
							selected={selectedGym?.id === gym.id}
							onClick={() => onSelectGym(gym)}
							userLocation={userLocation}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
