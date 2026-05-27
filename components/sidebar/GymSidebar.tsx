'use client';

import { Gym } from '@/types/gym';
import GymCard from './GymCard';
import EquipmentSearch from './EquipmentSearch';
import { Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { cn } from '@/lib/utils';

const pillCls =
	'flex items-center bg-[rgba(20,20,20,0.92)] border-[0.5px] border-[var(--border-color)] rounded-lg backdrop-blur pointer-events-auto';

export default function GymSidebar({
	gyms,
	selectedGym,
	onSelectGym,
	listOnly = false
}: {
	gyms: Gym[];
	selectedGym: Gym | null;
	onSelectGym: (gym: Gym) => void;
	listOnly?: boolean;
}) {
	const router = useRouter();
	const scrollRef = useRef<HTMLDivElement>(null);
	const userLocation = useUserLocation();
	const { filteredGyms } = useGymFilter();

	const baseGyms = Array.isArray(filteredGyms ?? gyms) ? (filteredGyms ?? gyms) : [];
	const displayGyms = userLocation
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
		: baseGyms;

	useEffect(() => {
		if (!selectedGym) return;
		const idx = displayGyms.findIndex((g) => g.id === selectedGym.id);
		if (idx === -1) return;
		requestAnimationFrame(() => {
			scrollRef.current
				?.querySelector(`#gym-card-${selectedGym.id}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
	}, [selectedGym]);

	return (
		<div id="GymSidebar" className="flex h-full flex-col">
			{!listOnly && (
				<div className="shrink-0 p-3 pb-0">
					{/* <div className="mb-2 mt-3">
						<EquipmentSearch />
					</div> */}
					<div className={cn(pillCls, 'mb-2 justify-between px-3 py-2')}>
						<span className="text-sub text-xs font-medium uppercase tracking-[0.08em]">
							{filteredGyms ? `${displayGyms.length} results` : `${gyms.length} gyms`}
						</span>
						<button
							onClick={() => router.push('/add/gym')}
							className="text-sub hover:text-text flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors duration-[0.22s]"
						>
							<Plus className="h-4 w-4" />
							Add
						</button>
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
