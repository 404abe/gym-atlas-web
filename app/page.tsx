'use client';
import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Eye, EyeOff, PanelLeftOpen, Search, X } from 'lucide-react';
import MapView from '@/components/map/MapView';
import GymSidebar from '@/components/sidebar/GymSidebar';
import GymStoriesRow from '@/components/sidebar/GymStoriesRow';
import GymPeekCard from '@/components/sidebar/GymPeekCard';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import CommandPalette, { type PaletteAnchor } from '@/components/ui/CommandPalette';
import SearchTrigger from '@/components/ui/SearchTrigger';
import { fetchGyms } from '@/lib/api';
import { Gym } from '@/types/gym';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { useUserLocation } from '@/hooks/useUserLocation';

/**
 * Bottom count badge + an eye toggle for how non-matching gyms display:
 * eye on = keep them on the map (dimmed) as before; eye off = hide them.
 */
function FilterCountBadge({
	total,
	showUnmatched,
	onToggle
}: {
	total: number;
	showUnmatched: boolean;
	onToggle: () => void;
}) {
	const { activeFilters, matchedGymIds, loading } = useGymFilter();
	if (activeFilters.length === 0) return null;

	const count = matchedGymIds?.size ?? 0;
	const only = activeFilters.length === 1 ? activeFilters[0] : null;

	return (
		<div className="border-border bg-bg/92 pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border py-1 pl-1 pr-3 shadow-lg backdrop-blur-sm">
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={showUnmatched}
				title={showUnmatched ? 'Hide gyms without a match' : 'Show all gyms (dim non-matching)'}
				className="text-sub hover:bg-text/5 hover:text-main flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition"
			>
				{showUnmatched ? <Eye size={14} /> : <EyeOff size={14} />}
			</button>
			<span className="text-sub text-[11px]">
				{loading && matchedGymIds === null ? (
					<>Finding gyms…</>
				) : (
					<>
						<span className="text-main font-semibold">{count}</span> of {total} gyms{' '}
						{only ? (
							<>
								have <span className="text-main">{only.name}</span>
							</>
						) : (
							<>
								match all <span className="text-main">{activeFilters.length}</span> filters
							</>
						)}
					</>
				)}
			</span>
		</div>
	);
}

/** Stacked top-right cards, one per active filter, each dismissible. */
function ActiveFilterCards() {
	const { activeFilters, removeFilter } = useGymFilter();
	if (activeFilters.length === 0) return null;

	return (
		<div className="absolute right-3 top-3 z-10 flex w-64 max-w-[calc(100%-24px)] flex-col gap-2">
			{activeFilters.map((filter) => (
				<div
					key={`${filter.kind}:${filter.key}`}
					className="border-border bg-bg/92 flex items-center gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur-sm"
				>
					<div className="bg-sub-alt flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
						{filter.imageUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={filter.imageUrl} alt="" className="h-full w-full object-cover" />
						) : (
							<Dumbbell size={16} className="text-sub" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-text m-0 truncate text-[12px] font-medium">{filter.name}</p>
						{filter.subtitle && (
							<p className="text-sub m-0 mt-0.5 truncate text-[11px]">{filter.subtitle}</p>
						)}
					</div>
					<button
						onClick={() => removeFilter(filter)}
						aria-label={`Remove ${filter.name} filter`}
						className="text-sub hover:text-main ml-1 shrink-0 transition"
					>
						<X size={13} />
					</button>
				</div>
			))}
		</div>
	);
}

export default function Page() {
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [sidebarWidth, setSidebarWidth] = useState(320);
	const [isResizingSidebar, setIsResizingSidebar] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [paletteInitialQuery, setPaletteInitialQuery] = useState('');
	const [paletteAnchor, setPaletteAnchor] = useState<PaletteAnchor | undefined>(undefined);
	// The desktop search trigger, so ⌘K (no click) can still anchor the palette to it.
	const desktopTriggerRef = useRef<HTMLDivElement>(null);
	const { matchedGymIds } = useGymFilter();
	const userLocation = useUserLocation();

	// Mobile: tapping the already-selected gym again (pin or story) closes the card.
	const toggleSelectGym = (gym: Gym) =>
		setSelectedGym((prev) => (prev?.id === gym.id ? null : gym));

	const openPalette = (initialQuery = '', anchor?: PaletteAnchor) => {
		setPaletteInitialQuery(initialQuery);
		setPaletteAnchor(anchor);
		setPaletteOpen(true);
	};

	useEffect(() => {
		fetchGyms().then(setGyms);
	}, []);

	// Cmd+. (Mac) / Ctrl+. toggles the gym list sidebar.
	// Cmd+K (Mac) / Ctrl+K opens the search palette anchored to the search pill.
	// Cmd+Shift+U (Mac) / Ctrl+Shift+U — test-only backup: same palette, centered.
	// ? opens the keyboard shortcuts popup (ignored while typing in a field).
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey) {
				if (event.key === '.') {
					event.preventDefault();
					setSidebarCollapsed((collapsed) => !collapsed);
				} else if (event.key.toLowerCase() === 'k') {
					event.preventDefault();
					if (paletteOpen) {
						setPaletteOpen(false);
					} else {
						const rect = desktopTriggerRef.current?.getBoundingClientRect();
						openPalette('', rect ? { left: rect.left, top: rect.top, width: rect.width } : undefined);
					}
				} else if (event.shiftKey && event.key.toLowerCase() === 'u') {
					event.preventDefault();
					if (paletteOpen) {
						setPaletteOpen(false);
					} else {
						openPalette(); // no anchor → CommandPalette falls back to centered
					}
				}
				return;
			}
			const target = event.target as HTMLElement;
			const isTyping =
				target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
			if (isTyping) return;
			if (event.key === '?') {
				event.preventDefault();
				setShortcutsOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [paletteOpen]);

	const [gymSearch, setGymSearch] = useState('');
	// Eye toggle: when on, every gym stays on the map (matches highlighted, the rest
	// dimmed) and the list shows all gyms; when off, non-matching gyms are dropped
	// from both the map and the list. Off by default.
	const [showUnmatched, setShowUnmatched] = useState(false);

	// Gyms whose equipment includes ALL selected filters.
	const filteredGyms = matchedGymIds ? gyms.filter((g) => matchedGymIds.has(g.id)) : gyms;
	// What the map and list actually render, per the eye toggle.
	const mapGyms = showUnmatched ? gyms : filteredGyms;
	const mapMatched = showUnmatched ? matchedGymIds : null;
	const listGyms = showUnmatched ? gyms : filteredGyms;
	const searchFilteredGyms = gymSearch
		? listGyms.filter(
				(g) =>
					g.name.toLowerCase().includes(gymSearch.toLowerCase()) ||
					g.city?.toLowerCase().includes(gymSearch.toLowerCase())
			)
		: listGyms;

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
		<>
			<div className="bg-bg flex h-full flex-col overflow-hidden md:fixed md:inset-0 md:z-10">
				{/* ── MOBILE LAYOUT ── */}
				<div className="flex h-full flex-col md:hidden">
					{/* search trigger — opens the command palette overlay */}
					<div className="shrink-0 px-3 pt-2">
						<SearchTrigger open={paletteOpen} onOpen={openPalette} />
					</div>

					{/* map — grows to fill the space above the gym search + stories row */}
					<div className="relative z-0 min-h-0 flex-1 px-3 pt-2">
						<div className="border-border relative h-full overflow-hidden rounded-2xl border">
							<FilterCountBadge
								total={gyms.length}
								showUnmatched={showUnmatched}
								onToggle={() => setShowUnmatched((v) => !v)}
							/>
							<ActiveFilterCards />
							<MapView
								gyms={mapGyms}
								selectedGym={selectedGym}
								onSelectGym={toggleSelectGym}
								userLocation={userLocation}
								matchedGymIds={mapMatched}
							/>
						</div>
					</div>

					{/* gym search */}
					<div className="relative shrink-0 px-3 py-2">
						<Search size={14} className="text-sub absolute left-6 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							placeholder="Search gyms..."
							value={gymSearch}
							onChange={(e) => setGymSearch(e.target.value)}
							className="border-border bg-sub-alt text-main placeholder:text-sub h-9 w-full rounded-xl border pl-8 pr-8 text-sm outline-none"
						/>
						{gymSearch && (
							<button
								onClick={() => setGymSearch('')}
								className="absolute right-6 top-1/2 -translate-y-1/2"
							>
								<X size={13} className="text-sub" />
							</button>
						)}
					</div>

					{/* selected-gym peek card — sits above the stories row (mobile only) */}
					{selectedGym && (
						<div className="shrink-0 px-3 pb-1">
							<GymPeekCard
								key={selectedGym.id}
								gym={selectedGym}
								userLocation={userLocation}
								onDismiss={() => setSelectedGym(null)}
							/>
						</div>
					)}

					{/* gym stories row — circular avatars at the bottom (mobile only) */}
					<GymStoriesRow
						gyms={searchFilteredGyms}
						selectedGym={selectedGym}
						onSelectGym={toggleSelectGym}
						userLocation={userLocation}
					/>
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
									className="text-sub hover:text-main hover:bg-sub-alt flex h-9 w-9 items-center justify-center rounded-xl transition"
								>
									<PanelLeftOpen size={16} />
								</button>
								<div className="bg-border mt-3 h-px w-5" />
								<div className="text-sub mt-3 text-[10px] uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
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
							aria-label={
								sidebarCollapsed
									? 'Click or drag right to expand gym list'
									: 'Click or drag left to collapse gym list'
							}
							title={
								sidebarCollapsed
									? 'Click or drag right to expand'
									: 'Click or drag left to collapse'
							}
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
								className={`bg-border group-hover:bg-main/50 h-full w-px rounded-full transition ${
									isResizingSidebar ? 'bg-main/60' : ''
								}`}
							/>
							<span className="border-border bg-bg/90 absolute top-1/2 flex h-14 w-4 -translate-y-1/2 items-center justify-center rounded-full border opacity-70 shadow-lg backdrop-blur transition group-hover:opacity-100">
								<span className="border-sub group-hover:border-main h-5 w-0.5 rounded-full border-x border-dotted" />
							</span>
						</div>
					</div>
					{/* Map — right, fills remaining space with proper rounded corners */}
					<div className="border-border relative min-h-0 flex-1 overflow-hidden rounded-2xl border">
						{/* search trigger — top left */}
						<div ref={desktopTriggerRef} className="absolute left-3 top-3 z-10">
							<SearchTrigger open={paletteOpen} onOpen={openPalette} />
						</div>
						<FilterCountBadge
							total={gyms.length}
							showUnmatched={showUnmatched}
							onToggle={() => setShowUnmatched((v) => !v)}
						/>
						<ActiveFilterCards />
						<MapView
							gyms={mapGyms}
							selectedGym={selectedGym}
							onSelectGym={setSelectedGym}
							userLocation={userLocation}
							matchedGymIds={mapMatched}
						/>
					</div>
				</div>
			</div>
			{shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}
			{paletteOpen && (
				<CommandPalette
					gyms={gyms}
					onSelectGym={setSelectedGym}
					onClose={() => setPaletteOpen(false)}
					initialQuery={paletteInitialQuery}
					anchor={paletteAnchor}
				/>
			)}
		</>
	);
}
