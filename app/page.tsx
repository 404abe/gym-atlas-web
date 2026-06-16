'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock, Crosshair, Dumbbell, Heart, Navigation, Search, X } from 'lucide-react';
import MapView from '@/components/map/MapView';
import GymSidebar from '@/components/sidebar/GymSidebar';
import EquipmentSearch from '@/components/sidebar/EquipmentSearch';
import { MobileEquipmentModal } from '@/app/_components/MobileEquipmentModal';
import { fetchGyms, fetchGymEquipment } from '@/lib/api';
import { Gym, GymEquipment } from '@/types/gym';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getOpenStatus } from '@/lib/openingHours';

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

export default function Page() {
	const router = useRouter();
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
	const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
	const [mobileGymSearchOpen, setMobileGymSearchOpen] = useState(false);
	const [filter24h, setFilter24h] = useState(false);
	const [peekEquipment, setPeekEquipment] = useState<GymEquipment[]>([]);
	const { filteredGyms, selectedEquipment, removeEquipment } = useGymFilter();
	const userLocation = useUserLocation();
	const bubbleRailRef = useRef<HTMLDivElement>(null);
	const peekCardRef = useRef<HTMLDivElement>(null);
	const peekDragRef = useRef<{ x: number; y: number } | null>(null);

	const [gymSearch, setGymSearch] = useState('');
	const baseList = filteredGyms ?? gyms;
	const searchFilteredGyms = gymSearch
		? baseList.filter(
				(g) =>
					g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
					g.city?.toLowerCase().includes(gymSearch.toLowerCase())
			)
		: baseList;

	const displayedGyms = filteredGyms ?? gyms;
	// TODO: apply filter24h once a reliable 24h field is added to Gym type (opening_hours has openNow but not a 24h flag)
	const mobileDisplayedGyms = searchFilteredGyms;

	const mobileSortedGyms = userLocation
		? [...mobileDisplayedGyms].sort((a, b) => {
				if (!a.lat || !a.lng) return 1;
				if (!b.lat || !b.lng) return -1;
				return (
					getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
					getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
				);
			})
		: mobileDisplayedGyms;

	useEffect(() => {
		fetchGyms().then(setGyms);
	}, []);

	const selectedGymId = selectedGym?.id ?? null;

	useEffect(() => {
		if (!selectedGymId) {
			setPeekEquipment([]);
			return;
		}
		fetchGymEquipment(selectedGymId).then(setPeekEquipment).catch(() => setPeekEquipment([]));
	}, [selectedGymId]);

	useEffect(() => {
		if (!selectedGym || !bubbleRailRef.current) return;
		const btn = bubbleRailRef.current.querySelector(`[data-gym-id="${selectedGym.id}"]`);
		btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
	}, [selectedGym]);

	const handleSelectMobile = (gym: Gym) => {
		setSelectedGym(gym);
		// TODO: fly MapView to gym — requires a MapView imperative ref
	};

	const onPeekTouchStart = (e: React.TouchEvent) => {
		peekDragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		if (peekCardRef.current) peekCardRef.current.style.transition = 'none';
	};

	const onPeekTouchMove = (e: React.TouchEvent) => {
		const start = peekDragRef.current;
		const el = peekCardRef.current;
		if (!start || !el) return;
		const dx = e.touches[0].clientX - start.x;
		const dy = e.touches[0].clientY - start.y;
		if (Math.abs(dy) > Math.abs(dx)) {
			if (dy > 0) el.style.transform = `translateY(${dy}px)`;
		} else {
			el.style.transform = `translateX(${dx}px)`;
		}
	};

	const onPeekTouchEnd = (e: React.TouchEvent) => {
		const start = peekDragRef.current;
		const el = peekCardRef.current;
		if (!start || !el) return;
		peekDragRef.current = null;

		const dx = e.changedTouches[0].clientX - start.x;
		const dy = e.changedTouches[0].clientY - start.y;
		const absX = Math.abs(dx);
		const absY = Math.abs(dy);

		if (absY > absX && dy > 60) {
			el.style.transition = 'transform 0.22s ease';
			el.style.transform = 'translateY(200%)';
			setTimeout(() => setSelectedGym(null), 220);
			return;
		}

		if (absX > absY && absX > 60) {
			const idx = mobileSortedGyms.findIndex((g) => g.id === selectedGym?.id);
			const nextIdx = dx > 0 ? idx + 1 : idx - 1;
			if (nextIdx >= 0 && nextIdx < mobileSortedGyms.length) {
				el.style.transition = 'transform 0.18s ease';
				el.style.transform = `translateX(${dx > 0 ? '110%' : '-110%'})`;
				// key={selectedGym.id} on the card remounts it clean after gym changes
				setTimeout(() => handleSelectMobile(mobileSortedGyms[nextIdx]), 180);
				return;
			}
		}

		el.style.transition = 'transform 0.2s ease';
		el.style.transform = '';
	};

	const peekOpenStatus = selectedGym ? getOpenStatus(selectedGym.opening_hours) : null;
	const peekDistance =
		selectedGym && userLocation && selectedGym.lat && selectedGym.lng
			? getDistanceKm(userLocation.lat, userLocation.lng, selectedGym.lat, selectedGym.lng)
			: null;
	const showOverflow = peekEquipment.length > 4;
	const peekShown = peekEquipment.slice(0, showOverflow ? 3 : 4);
	const peekOverflow = showOverflow ? peekEquipment.length - 3 : 0;

	return (
		<div className="fixed inset-0 z-10 overflow-hidden bg-bg">
			{/* ── MOBILE LAYOUT ── */}
			<div className="relative h-full overflow-hidden md:hidden">
				{/* Full-screen map */}
				<div className="absolute inset-0">
					<MapView
						gyms={mobileDisplayedGyms}
						selectedGym={selectedGym}
						onSelectGym={handleSelectMobile}
						userLocation={userLocation}
						isFiltered={filteredGyms !== null}
					/>
				</div>

				{/* Search bar — top-14 clears the 48px MobileHeader */}
				<div className="absolute left-3 right-3 top-14 z-30 flex gap-2">
					{mobileGymSearchOpen ? (
						<>
							<div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-bg/85 px-3 py-2.5 backdrop-blur-sm">
								<Search size={14} className="shrink-0 text-sub" />
								<input
									autoFocus
									value={gymSearch}
									onChange={(e) => setGymSearch(e.target.value)}
									placeholder="Search gyms..."
									className="min-w-0 flex-1 bg-transparent text-xs text-text placeholder:text-sub outline-none"
								/>
								{gymSearch && (
									<button onClick={() => setGymSearch('')}>
										<X size={12} className="text-sub" />
									</button>
								)}
							</div>
							<button
								onClick={() => { setMobileGymSearchOpen(false); setGymSearch(''); }}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-bg/85 text-sub backdrop-blur-sm"
								aria-label="Cancel search"
							>
								<X size={16} />
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => setMobileGymSearchOpen(true)}
								className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-bg/85 px-3 py-2.5 text-xs text-sub backdrop-blur-sm"
							>
								<Search size={14} />
								<span>Search gyms...</span>
							</button>
							<button
								onClick={() => (selectedGym ? setSelectedGym(null) : void 0 /* TODO: fly to user location */)}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-bg/85 text-sub backdrop-blur-sm"
								aria-label={selectedGym ? 'Close' : 'My location'}
							>
								{selectedGym ? <X size={16} /> : <Crosshair size={16} />}
							</button>
						</>
					)}
				</div>

				{/* Filter pills — hidden when a gym is selected */}
				{!selectedGym && (
					<div
						className="absolute left-3 top-26 z-30 flex gap-2 overflow-x-auto"
						style={{ scrollbarWidth: 'none' }}
					>
						<button
							onClick={() => setFilter24h((v) => !v)}
							className={
								filter24h
									? 'shrink-0 rounded-full bg-main px-3 py-1.5 text-xs font-medium text-bg'
									: 'shrink-0 rounded-full border border-white/15 bg-bg/80 px-3 py-1.5 text-xs text-sub backdrop-blur-sm'
							}
						>
							Open 24h
						</button>
						<button className="shrink-0 rounded-full border border-white/15 bg-bg/80 px-3 py-1.5 text-xs text-sub backdrop-blur-sm">
							Nearest
						</button>
						<button
							onClick={() => setMobileSearchOpen(true)}
							className="shrink-0 rounded-full border border-white/15 bg-bg/80 px-3 py-1.5 text-xs text-sub backdrop-blur-sm"
						>
							+ Machine
						</button>
					</div>
				)}

				{/* Equipment filter cards — right side, stacked below filter pills */}
				{!selectedGym && selectedEquipment.length > 0 && (
					<div className="absolute right-3 top-36 z-30 flex flex-col gap-2">
						{selectedEquipment.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-2 rounded-2xl border border-border bg-bg/92 p-2 pr-2.5 shadow-sm backdrop-blur-sm"
							>
								<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sub-alt">
									{item.image_url ? (
										<img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
									) : (
										<Dumbbell size={13} className="text-sub" />
									)}
								</div>
								<div className="min-w-0">
									<p className="max-w-30 truncate text-[11px] font-medium leading-tight text-text">
										{item.brand} {item.name}
									</p>
									{item.series && (
										<p className="text-[10px] leading-tight text-sub">{item.series}</p>
									)}
								</div>
								<button
									onClick={() => removeEquipment(item)}
									className="ml-0.5 shrink-0 text-sub/70 transition hover:text-sub"
								>
									<X size={11} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Bottom region: peek card + bubble rail */}
				<div className="absolute bottom-0 left-0 right-0 z-20">
					{/* Peek card */}
					{selectedGym && (
						<div
							key={selectedGym.id}
							ref={peekCardRef}
							onTouchStart={onPeekTouchStart}
							onTouchMove={onPeekTouchMove}
							onTouchEnd={onPeekTouchEnd}
							className="mx-3 mb-2 rounded-2xl border border-border bg-surface p-3.5"
						>
							<div className="flex items-center gap-2.5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sub-alt">
									{selectedGym.image_url ? (
										<img
											src={selectedGym.image_url}
											alt={selectedGym.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<Dumbbell size={18} className="text-sub" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold leading-tight text-text">
										{selectedGym.name}
									</p>
									<p className="mt-0.5 flex items-center gap-1 text-xs text-sub">
										<span>{selectedGym.city ?? 'Gym'}</span>
										{peekDistance !== null && (
											<>
												<span>·</span>
												<Navigation size={10} className="shrink-0" />
												<span>{formatDistance(peekDistance)}</span>
											</>
										)}
									</p>
								</div>
								<button
									onClick={() => router.push(`/gyms/${selectedGym.id}`)}
									className="shrink-0 rounded-lg bg-sub-alt p-2 text-sub transition hover:text-text"
									aria-label="View gym"
								>
									<ArrowRight size={14} />
								</button>
							</div>

							<div
								className="mt-2 flex items-center gap-1.5 overflow-x-auto"
								style={{ scrollbarWidth: 'none' }}
							>
								<span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
									<Dumbbell size={10} />
									{selectedGym.total_equipment ?? 0}
								</span>
								{peekOpenStatus && (
									<span
										className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
											peekOpenStatus.status === 'open'
												? 'border-[#1a4a28] bg-[#0d2e1a] text-[#4ade80]'
												: peekOpenStatus.status === 'closing_soon'
													? 'border-[#4a2e10] bg-[#2a1a0d] text-[#fb923c]'
													: 'border-[#4a2020] bg-[#2a1010] text-[#f87171]'
										}`}
									>
										<Clock size={10} className="shrink-0" />
										<span>{peekOpenStatus.label}</span>
									</span>
								)}
								<span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
									<Heart size={10} />
									{selectedGym.favourites ?? 0}
								</span>
								{selectedGym.avg_rating != null && (
									<span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-sub">
										★ {Number(selectedGym.avg_rating).toFixed(1)}
									</span>
								)}
							</div>

							{peekShown.length > 0 && (
								<div className="mt-2 flex gap-1.5">
									{peekShown.map((eq) => (
										<div
											key={eq.equipment_id}
											className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sub-alt"
										>
											{eq.image_url ? (
												<img
													src={eq.image_url}
													alt={eq.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<Dumbbell size={16} className="text-sub" />
												</div>
											)}
										</div>
									))}
									{peekOverflow > 0 && (
										<div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-sub-alt text-xs font-medium text-sub">
											+{peekOverflow}
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{/* Bubble rail */}
					<div
						ref={bubbleRailRef}
						className="flex gap-2.5 overflow-x-auto px-3 pb-3 pt-1"
						style={{ scrollbarWidth: 'none' }}
					>
						{mobileSortedGyms.map((gym) => (
							<button
								key={gym.id}
								data-gym-id={gym.id}
								onClick={() => handleSelectMobile(gym)}
								className="flex shrink-0 flex-col items-center gap-1"
							>
								<div
									className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[2.5px] ${
										selectedGym?.id === gym.id ? 'border-main' : 'border-border'
									} bg-sub-alt`}
								>
									{gym.image_url ? (
										<img src={gym.image_url} alt={gym.name} className="h-full w-full object-cover" />
									) : (
										<Dumbbell size={18} className="text-sub" />
									)}
								</div>
								<span className="max-w-13 truncate text-[9px] leading-tight text-sub">
									{gym.name}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* ── DESKTOP LAYOUT ── */}
			<div className="relative hidden h-full md:flex md:gap-3 md:p-3 md:pt-14">
				<div className="flex h-full w-80 shrink-0 flex-col pt-3">
					<GymSidebar
						gyms={searchFilteredGyms}
						selectedGym={selectedGym}
						onSelectGym={setSelectedGym}
						gymSearch={gymSearch}
						onGymSearchChange={setGymSearch}
					/>
				</div>
				<div className="border-border relative min-h-0 flex-1 overflow-hidden rounded-2xl border">
					<div className="absolute left-3 top-3 z-10">
						<EquipmentSearch />
					</div>
					{selectedEquipment.length > 0 && (
						<div className="absolute right-3 top-3 z-10 flex w-64 flex-col gap-2">
							{selectedEquipment.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-3 rounded-2xl border border-border bg-bg/92 p-3 shadow-lg backdrop-blur-sm"
								>
									<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
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
									<div className="min-w-0 flex-1">
										<p className="text-text m-0 truncate text-[12px] font-medium">
											{item.brand} {item.name}
										</p>
										<p className="text-sub m-0 mt-0.5 text-[11px]">{item.series}</p>
									</div>
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
						gyms={displayedGyms}
						selectedGym={selectedGym}
						onSelectGym={setSelectedGym}
						userLocation={userLocation}
						isFiltered={filteredGyms !== null}
					/>
				</div>
			</div>

			{/* ── SHARED ── */}
			{mobileSearchOpen && <MobileEquipmentModal onClose={() => setMobileSearchOpen(false)} />}
		</div>
	);
}
