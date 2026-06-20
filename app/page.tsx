'use client';
import { useEffect, useState } from 'react';
import { Dumbbell, PanelLeftOpen, Search, X } from 'lucide-react';
import MapView from '@/components/map/MapView';
import GymSidebar from '@/components/sidebar/GymSidebar';
import EquipmentSearch from '@/components/sidebar/EquipmentSearch';
import { MobileEquipmentModal } from '@/app/_components/MobileEquipmentModal';
import { fetchGyms } from '@/lib/api';
import { Gym } from '@/types/gym';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { useUserLocation } from '@/hooks/useUserLocation';



export default function Page() {
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
	const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(320);
	const [isResizingSidebar, setIsResizingSidebar] = useState(false);
	const { filteredGyms, selectedEquipment, removeEquipment } = useGymFilter();
	const userLocation = useUserLocation();

	useEffect(() => {
		fetchGyms().then(setGyms);
	}, []);

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

	const startSidebarResize = (startX: number) => {
		const startWidth = sidebarCollapsed ? 48 : sidebarWidth;
		let hasMoved = false;
		setIsResizingSidebar(true);

		const onPointerMove = (event: PointerEvent) => {
			const delta = event.clientX - startX;
			if (Math.abs(delta) < 6) return;
			hasMoved = true;
			const nextWidth = startWidth + event.clientX - startX;
			if (nextWidth < 170) {
				setSidebarCollapsed(true);
				return;
			}
			setSidebarCollapsed(false);
			setSidebarWidth(Math.min(460, Math.max(280, nextWidth)));
		};

		const onPointerUp = () => {
			setIsResizingSidebar(false);
			if (!hasMoved) {
				setSidebarCollapsed((collapsed) => !collapsed);
			}
			document.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerup', onPointerUp);
		};

		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
	};

	return (
		<div className="flex h-full flex-col overflow-hidden bg-bg md:fixed md:inset-0 md:z-10">
			{/* ── MOBILE LAYOUT ── */}
			<div className="flex h-full flex-col md:hidden">
				{/* equipment chips row */}
				<div
					className="flex min-w-0 shrink-0 items-center gap-2 overflow-x-auto pb-1 pl-3 pt-2"
					style={{ scrollbarWidth: 'none' }}
				>
					{selectedEquipment.map((item) => (
						<div
							key={item.id}
							className="bg-main/10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1"
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
							gyms={displayedGyms}
							selectedGym={selectedGym}
							onSelectGym={setSelectedGym}
							userLocation={userLocation}
							isFiltered={filteredGyms !== null}
						/>
					</div>
				</div>

				{/* gym search */}
				<div className="relative shrink-0 px-3 py-2">
					<Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-sub" />
					<input
						type="text"
						placeholder="Search gyms..."
						value={gymSearch}
						onChange={(e) => setGymSearch(e.target.value)}
						className="h-9 w-full rounded-xl border border-border bg-sub-alt pl-8 pr-8 text-sm text-main placeholder:text-sub outline-none"
					/>
					{gymSearch && (
						<button onClick={() => setGymSearch('')} className="absolute right-6 top-1/2 -translate-y-1/2">
							<X size={13} className="text-sub" />
						</button>
					)}
				</div>

				{/* gym list */}
				<div className="min-h-0 flex-1">
					<GymSidebar gyms={searchFilteredGyms} selectedGym={selectedGym} onSelectGym={setSelectedGym} listOnly />
				</div>
			</div>

			{/* ── DESKTOP LAYOUT ── */}
			<div className="relative hidden h-full md:flex md:gap-3 md:p-3 md:pt-[56px]">
				{/* Sidebar — left, fixed width w-80 (320px) with pt-3 to clear header */}
				<div
					className={`relative flex h-full shrink-0 flex-col pt-3 ${
						isResizingSidebar ? '' : 'transition-[width] duration-200 ease-out'
					}`}
					style={{ width: sidebarCollapsed ? 44 : sidebarWidth }}
				>
					{sidebarCollapsed ? (
						<div className="border-border bg-surface/70 flex h-full flex-col items-center rounded-2xl border py-3">
							<button
								onClick={() => setSidebarCollapsed(false)}
								title="Expand gym list"
								className="text-sub hover:text-main flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-sub-alt"
							>
								<PanelLeftOpen size={16} />
							</button>
							<div className="mt-3 h-px w-5 bg-border" />
							<div className="mt-3 [writing-mode:vertical-rl] text-[10px] uppercase tracking-[0.18em] text-sub">
								{searchFilteredGyms.length} gyms
							</div>
						</div>
					) : (
						<GymSidebar
							gyms={searchFilteredGyms}
							selectedGym={selectedGym}
							onSelectGym={setSelectedGym}
							gymSearch={gymSearch}
							onGymSearchChange={setGymSearch}
							onCollapse={() => setSidebarCollapsed(true)}
						/>
					)}
					<div
						role="button"
						tabIndex={0}
						aria-label={sidebarCollapsed ? 'Click or drag right to expand gym list' : 'Click or drag left to collapse gym list'}
						title={sidebarCollapsed ? 'Click or drag right to expand' : 'Click or drag left to collapse'}
						onPointerDown={(event) => {
							event.preventDefault();
							startSidebarResize(event.clientX);
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								setSidebarCollapsed((collapsed) => !collapsed);
							}
						}}
						className={`group absolute bottom-0 right-[-10px] top-3 z-20 flex w-5 cursor-ew-resize items-center justify-center ${
							isResizingSidebar ? 'select-none' : ''
						}`}
					>
						<span
							className={`h-full w-px rounded-full bg-border transition group-hover:bg-main/50 ${
								isResizingSidebar ? 'bg-main/60' : ''
							}`}
						/>
						<span className="absolute top-1/2 flex h-14 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/90 opacity-70 shadow-lg backdrop-blur transition group-hover:opacity-100">
							<span className="h-5 w-0.5 rounded-full border-x border-dotted border-sub group-hover:border-main" />
						</span>
					</div>
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
						gyms={displayedGyms}
						selectedGym={selectedGym}
						onSelectGym={setSelectedGym}
						userLocation={userLocation}
						isFiltered={filteredGyms !== null}
					/>
				</div>
			</div>

			{/* ── SHARED (renders on both) ── */}
			{mobileSearchOpen && <MobileEquipmentModal onClose={() => setMobileSearchOpen(false)} />}
		</div>
	);
}
