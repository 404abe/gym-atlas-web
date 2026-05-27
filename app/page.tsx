'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, X } from 'lucide-react';
import MapView from '@/components/map/MapView';
import GymSidebar from '@/components/sidebar/GymSidebar';
import EquipmentSearch from '@/components/sidebar/EquipmentSearch';
import MobileHeader from '@/components/layout/MobileHeader';
import { MobileEquipmentModal } from '@/app/_components/MobileEquipmentModal';
import { fetchGyms } from '@/lib/api';
import { Gym } from '@/types/gym';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { useUserLocation } from '@/hooks/useUserLocation';

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Page() {
	const router = useRouter();
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
	const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
	const { filteredGyms, selectedEquipment, removeEquipment } = useGymFilter();
	const userLocation = useUserLocation();

	useEffect(() => {
		fetchGyms().then(setGyms);
	}, []);

	const displayCount = filteredGyms ? filteredGyms.length : gyms.length;
	const countLabel = filteredGyms ? `${displayCount} gyms match` : `${displayCount} gyms`;

	return (
		<div className="flex h-full flex-col overflow-hidden bg-bg md:fixed md:inset-0 md:z-10">
			{/* ── MOBILE LAYOUT ── */}
			<div className="flex h-full flex-col md:hidden">
				<MobileHeader />

				{/* equipment chips row */}
				<div
					className="flex min-w-0 shrink-0 items-center gap-2 overflow-x-auto pb-1 pl-3 pt-2"
					style={{ scrollbarWidth: 'none' }}
				>
					{selectedEquipment.map((item) => (
						<div
							key={item.id}
							className="border-main/30 bg-main/10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1"
						>
							<Dumbbell size={11} className="text-main" />
							<span className="text-main text-xs">
								{item.brand} {item.name}
							</span>
							<button
								onClick={() => removeEquipment(item)}
								className="text-main/70 hover:text-main ml-0.5 transition"
							>
								<X size={10} />
							</button>
						</div>
					))}
					<button
						onClick={() => setMobileSearchOpen(true)}
						className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-sub transition hover:border-sub hover:text-[#6c6c6c]"
					>
						+ Add machine
					</button>
					{/* right-edge spacer — px-3 on scroll containers doesn't extend scroll width */}
					<div className="w-3 shrink-0" aria-hidden="true" />
				</div>

				{/* map */}
				<div className="z-0 shrink-0 px-3">
					<div className="border-border relative h-[45vh] overflow-hidden rounded-2xl border">
						<MapView
							gyms={gyms}
							selectedGym={selectedGym}
							onSelectGym={setSelectedGym}
							userLocation={userLocation}
						/>
					</div>
				</div>

				{/* gym count row */}
				<div className="flex shrink-0 items-center justify-between px-3 py-2.5">
					<span className="text-sm text-sub">{countLabel}</span>
					<button
						onClick={() => router.push('/add')}
						className="flex items-center gap-1.5 rounded border border-border bg-sub-alt px-2.5 py-1 text-xs text-sub transition hover:text-text"
					>
						<Plus size={11} />
						Add gym
					</button>
				</div>

				{/* gym list */}
				<div className="min-h-0 flex-1">
					<GymSidebar gyms={gyms} selectedGym={selectedGym} onSelectGym={setSelectedGym} listOnly />
				</div>
			</div>

			{/* ── DESKTOP LAYOUT ── */}
			<div className="relative hidden h-full md:flex md:gap-3 md:p-3 md:pt-[56px]">
				{/* Sidebar — left, fixed width w-80 (320px) with pt-3 to clear header */}
				<div className="flex h-full w-80 shrink-0 flex-col pt-3">
					<GymSidebar gyms={gyms} selectedGym={selectedGym} onSelectGym={setSelectedGym} />
				</div>
				{/* Map — right, fills remaining space with proper rounded corners */}
				<div className="border-border relative min-h-0 flex-1 overflow-hidden rounded-2xl border">
					{/* search — top left */}
					<div className="absolute left-3 top-3 z-10">
						<EquipmentSearch />
					</div>
					{/* selected equipment — top right, notification card style */}
					{selectedEquipment.length > 0 && (
						<div
							className="absolute right-3 top-3 z-10 flex w-64 flex-col gap-2"
						>
							{selectedEquipment.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-3 rounded-2xl border border-border bg-bg/92 p-3 shadow-lg backdrop-blur-sm"
								>
									{/* image/icon square */}
									<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border">
										{item.image_url ? (
											<img
												src={item.image_url}
												alt={item.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<Dumbbell size={16} className="text-sub" />
										)}
									</div>

									{/* text */}
									<div className="min-w-0 flex-1">
										<p className="text-text m-0 truncate text-[12px] font-medium">
											{item.brand} {item.name}
										</p>
										<p className="text-sub m-0 mt-0.5 text-[11px]">{item.series}</p>
									</div>

									{/* dismiss */}
									<button
										onClick={() => removeEquipment(item)}
										className="text-sub hover:text-main ml-1 shrink-0 transition"
									>
										<X size={13} />
									</button>
								</div>
							))}
						</div>
					)}
					<MapView
						gyms={gyms}
						selectedGym={selectedGym}
						onSelectGym={setSelectedGym}
						userLocation={userLocation}
					/>
				</div>
			</div>

			{/* ── SHARED (renders on both) ── */}
			{mobileSearchOpen && <MobileEquipmentModal onClose={() => setMobileSearchOpen(false)} />}
		</div>
	);
}
