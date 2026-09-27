'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
	Check,
	ChevronUp,
	Dumbbell,
	Loader2,
	MapPin,
	Minus,
	Plus,
	Search,
	ShieldCheck,
	X
} from 'lucide-react';
import { cn, formatDistance, getDistanceKm, matchesSearch } from '@/lib/utils';
import { logoForGym } from '@/lib/gymLogos';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { addGymEquipment, fetchGymEquipment } from '@/lib/api';
import type { Gym, GymEquipment } from '@/types/gym';
import type { Equipment } from '@/types/equipment';

type Props = {
	gyms: Gym[];
	equipment: Equipment[];
	preselectedEquipmentId?: number;
	preselectedGymId?: number;
	/** Switch to the New machine / New gym tabs when what they want isn't listed. */
	onCreateMachine: () => void;
	onCreateGym: () => void;
};

type SelectedMachine = { id: number; qty: number };

const GYM_RESULTS = 8;
const MACHINE_RESULTS = 60;
const MAX_CATEGORY_CHIPS = 6;

const equipLabel = (e: Equipment) => [e.brand, e.series, e.name].filter(Boolean).join(' ');
const brandLine = (e: Equipment) => [e.brand, e.series].filter(Boolean).join(' · ');

// ── Small building blocks ───────────────────────────────

function StepBadge({ n }: { n: number }) {
	return (
		<span className="bg-main text-bg flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
			{n}
		</span>
	);
}

function GymThumb({ gym, size }: { gym: Gym; size: 'sm' | 'md' }) {
	const logo = logoForGym(gym.name);
	const box = size === 'md' ? 'h-13 w-13 rounded-xl' : 'h-10.5 w-10.5 rounded-[10px]';
	return (
		<div
			className={cn(
				'border-border relative flex shrink-0 items-center justify-center overflow-hidden border',
				box,
				gym.image_url || logo ? 'bg-white' : 'bg-sub-alt'
			)}
		>
			{gym.image_url ? (
				<Image src={gym.image_url} alt="" fill sizes="52px" className="object-cover" />
			) : logo ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={logo} alt="" className="h-[85%] w-[85%] object-contain" />
			) : (
				<span className="text-main text-base font-semibold">{gym.name.slice(0, 1).toUpperCase()}</span>
			)}
		</div>
	);
}

/** Light photo well so white-background product shots blend in (both themes). */
function MachinePhoto({ item, className, sizes }: { item: Equipment; className: string; sizes: string }) {
	return (
		<div className={cn('relative flex items-center justify-center overflow-hidden bg-[#eeede9]', className)}>
			{item.image_url ? (
				<Image src={item.image_url} alt="" fill sizes={sizes} className="object-contain p-2 mix-blend-multiply" />
			) : (
				<Dumbbell className="h-1/3 w-1/3 text-[#a7a49a]" />
			)}
		</div>
	);
}

function QtyStepper({
	name,
	qty,
	onChange,
	large = false
}: {
	name: string;
	qty: number;
	onChange: (delta: number) => void;
	large?: boolean;
}) {
	const btn = cn(
		'text-sub hover:text-main flex items-center justify-center transition-colors disabled:opacity-40',
		large ? 'h-11 w-10' : 'h-8 w-8'
	);
	return (
		<div className={cn('border-border bg-bg flex shrink-0 items-center rounded-full border', large ? 'h-11' : 'h-8.5')}>
			<button type="button" onClick={() => onChange(-1)} disabled={qty <= 1} aria-label={`Fewer ${name}`} className={btn}>
				<Minus className="h-3.5 w-3.5" />
			</button>
			<span className="text-main min-w-4 text-center text-sm font-medium tabular-nums">{qty}</span>
			<button type="button" onClick={() => onChange(1)} aria-label={`More ${name}`} className={btn}>
				<Plus className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

/** Height of the on-screen keyboard (0 when closed), from the visual viewport. */
function useKeyboardInset() {
	const [inset, setInset] = useState(0);
	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
		vv.addEventListener('resize', update);
		vv.addEventListener('scroll', update);
		update();
		return () => {
			vv.removeEventListener('resize', update);
			vv.removeEventListener('scroll', update);
		};
	}, []);
	return inset;
}

// ── Main ────────────────────────────────────────────────

export default function AssignEquipmentCard({
	gyms,
	equipment,
	preselectedEquipmentId,
	preselectedGymId,
	onCreateMachine,
	onCreateGym
}: Props) {
	const { addToast } = useToastContext();
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();

	const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
	const [machines, setMachines] = useState<SelectedMachine[]>([]);
	const [gymQuery, setGymQuery] = useState('');
	const [machineQuery, setMachineQuery] = useState('');
	const [category, setCategory] = useState<string | null>(null);
	const [brand, setBrand] = useState<string>('');
	const [reviewOpen, setReviewOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [justAdded, setJustAdded] = useState(false);
	const [preselectApplied, setPreselectApplied] = useState(false);

	const gymInputRef = useRef<HTMLInputElement>(null);
	const machineInputRef = useRef<HTMLInputElement>(null);
	const keyboardInset = useKeyboardInset();
	const keyboardOpen = keyboardInset > 80;

	// Deep links: /add?equipmentId=… and /add?gymId=…, applied once the data they
	// point at has loaded (state adjusted during render rather than in an effect).
	const preselectReady =
		(!preselectedEquipmentId || equipment.length > 0) && (!preselectedGymId || gyms.length > 0);
	if (!preselectApplied && preselectReady) {
		setPreselectApplied(true);
		if (preselectedEquipmentId && equipment.some((e) => e.id === preselectedEquipmentId)) {
			setMachines((prev) =>
				prev.some((m) => m.id === preselectedEquipmentId) ? prev : [...prev, { id: preselectedEquipmentId, qty: 1 }]
			);
		}
		if (preselectedGymId && gyms.some((g) => g.id === preselectedGymId)) setSelectedGymId(preselectedGymId);
	}

	const selectedGym = gyms.find((g) => g.id === selectedGymId) ?? null;

	// Equipment already at the selected gym, keyed by gym so a stale list never shows for another gym.
	const [gymStock, setGymStock] = useState<{ gymId: number; items: GymEquipment[] } | null>(null);
	useEffect(() => {
		if (!selectedGymId) return;
		let cancelled = false;
		fetchGymEquipment(selectedGymId)
			.then((items) => {
				if (!cancelled) setGymStock({ gymId: selectedGymId, items });
			})
			.catch(console.error);
		return () => {
			cancelled = true;
		};
	}, [selectedGymId]);
	const stock = gymStock && gymStock.gymId === selectedGymId ? gymStock.items : null;
	const inGymMap = new Map((stock ?? []).map((e) => [e.equipment_id, e] as const));

	// Only ask for location once the user starts choosing a gym.
	const [locationWanted, setLocationWanted] = useState(false);
	const userLocation = useUserLocation(locationWanted);

	const gymDistance = (g: Gym) =>
		userLocation && g.lat && g.lng ? getDistanceKm(userLocation.lat, userLocation.lng, g.lat, g.lng) : null;

	// Nearest first when we know where the user is; gyms without coordinates go last.
	const filteredGyms = gyms
		.filter((g) => matchesSearch(gymQuery, g.name, g.city, g.country))
		.map((g) => ({ gym: g, distance: gymDistance(g) }))
		.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

	// Category chips: the most common categories in the catalogue.
	const categories = useMemo(() => {
		const counts = new Map<string, number>();
		for (const e of equipment) {
			const c = e.exercise?.category_name;
			if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
		}
		return [...counts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, MAX_CATEGORY_CHIPS)
			.map(([name]) => name);
	}, [equipment]);

	const brands = useMemo(
		() => [...new Set(equipment.map((e) => e.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
		[equipment]
	);

	const filteredEquipment = equipment.filter(
		(e) =>
			matchesSearch(machineQuery, e.brand, e.series, e.name, e.exercise?.name) &&
			(!category || e.exercise?.category_name === category) &&
			(!brand || e.brand === brand)
	);
	const shownEquipment = filteredEquipment.slice(0, MACHINE_RESULTS);

	const selectedMachines = machines
		.map((m) => {
			const item = equipment.find((e) => e.id === m.id);
			return item ? { ...item, qty: m.qty } : null;
		})
		.filter((m): m is Equipment & { qty: number } => m !== null);

	const toggleMachine = (id: number) =>
		setMachines((prev) =>
			prev.some((m) => m.id === id) ? prev.filter((m) => m.id !== id) : [...prev, { id, qty: 1 }]
		);
	const adjustQty = (id: number, delta: number) =>
		setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, qty: Math.max(1, m.qty + delta) } : m)));
	const removeMachine = (id: number) => setMachines((prev) => prev.filter((m) => m.id !== id));

	const chooseGym = (id: number) => {
		setSelectedGymId(id);
		setGymQuery('');
		gymInputRef.current?.blur();
	};

	const canSubmit = !!selectedGymId && selectedMachines.length > 0;
	const totalQty = machines.reduce((sum, m) => sum + m.qty, 0);

	const handleSubmit = async () => {
		if (!canSubmit || isSubmitting || justAdded || !selectedGymId) return;
		if (!requireAuth('assign equipment to a gym')) return;
		setIsSubmitting(true);
		try {
			await Promise.all(machines.map((m) => addGymEquipment(selectedGymId, m.id, m.qty)));
			const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
			const gymName = selectedGym?.name ?? 'the gym';
			const summary =
				selectedMachines.length === 1 ? equipLabel(selectedMachines[0]) : `${selectedMachines.length} machines`;
			addToast(
				isAdmin ? `Added ${summary} to ${gymName}` : `Suggested ${summary} for ${gymName} — pending review`,
				'success'
			);
			setJustAdded(true);
			setReviewOpen(false);
			setTimeout(() => {
				setJustAdded(false);
				setMachines([]);
				// Refresh "already at this gym" so the new machines show as listed.
				fetchGymEquipment(selectedGymId)
					.then((items) => setGymStock({ gymId: selectedGymId, items }))
					.catch(console.error);
			}, 1500);
		} catch {
			addToast('Failed to assign equipment to gym', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const machineWord = totalQty === 1 ? 'machine' : 'machines';
	const ctaLabel = justAdded
		? 'Added'
		: isSubmitting
			? 'Adding…'
			: !selectedGym
				? 'Choose a gym first'
				: totalQty === 0
					? 'Add machines to continue'
					: `Add ${totalQty} ${machineWord} to ${selectedGym.name}`;
	const ctaShort = justAdded ? 'Added' : isSubmitting ? 'Adding…' : `Add ${totalQty} ${machineWord}`;

	const ctaIcon = isSubmitting ? (
		<Loader2 className="h-4.5 w-4.5 animate-spin" />
	) : justAdded ? (
		<Check className="h-4.5 w-4.5" />
	) : null;

<<<<<<< Updated upstream
	// ── Pieces ──

	const additionsList = (large: boolean) => (
		<ul className="flex flex-col gap-2">
			{selectedMachines.map((m) => (
				<li key={m.id} className={cn('bg-bg flex items-center gap-3 rounded-2xl p-2.5', large && 'bg-sub-alt')}>
					<MachinePhoto item={m} className="h-11 w-11 shrink-0 rounded-[10px]" sizes="44px" />
					<div className="min-w-0 flex-1">
						<div className="text-main truncate text-sm font-medium">{m.name}</div>
						<div className="text-sub truncate text-xs">{brandLine(m)}</div>
					</div>
					<QtyStepper name={m.name} qty={m.qty} onChange={(d) => adjustQty(m.id, d)} large={large} />
=======
	const machineResults = (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(min(160px,calc(50%-0.375rem)),1fr))] gap-3">
			{filteredEquipment.map((item) => {
				const selected = machines.some((m) => m.id === item.id);
				const existing = inGymMap.get(item.id);
				// Space-style hierarchy: small grey eyebrow (brand + series), big headline (machine name).
				const eyebrow = [item.brand, item.series].filter(Boolean).join(' ');
				const headline = item.name || equipLabel(item);
				return (
>>>>>>> Stashed changes
					<button
						type="button"
<<<<<<< Updated upstream
						onClick={() => removeMachine(m.id)}
						aria-label={`Remove ${m.name}`}
						className="text-sub hover:text-main flex h-8 w-8 shrink-0 items-center justify-center"
					>
						<X className="h-4 w-4" />
=======
						onClick={() => toggleMachine(item.id)}
						aria-pressed={selected}
						className={`group bg-surface relative flex flex-col overflow-hidden rounded-[22px] text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(0,0,0,0.25)] active:translate-y-0 active:scale-[0.985] ${
							selected ? 'ring-accent ring-2' : 'ring-border/70 ring-1'
						}`}
					>
						{/* Stage: soft grey shelf the machine floats on */}
						<div className="from-surface to-sub-alt relative flex aspect-[5/4] w-full items-center justify-center bg-linear-to-b">
							{/* Soft spotlight so dark machines still lift off the stage in dark mode */}
							<div className="bg-main/[0.07] pointer-events-none absolute inset-x-[18%] inset-y-[14%] rounded-full blur-2xl" />
							{item.image_url ? (
								<Image
									src={item.image_url}
									alt={item.name}
									fill
									sizes="(max-width: 640px) 50vw, 220px"
									className="object-contain p-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
								/>
							) : (
								<Dumbbell className="text-sub h-9 w-9 opacity-30" />
							)}

							{existing && (
								<div className="bg-bg/80 text-main ring-border/60 absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 backdrop-blur-md">
									<span
										className={`h-1.5 w-1.5 rounded-full ${
											existing.status === 'pending' ? 'bg-amber-400' : 'bg-accent'
										}`}
									/>
									{existing.status === 'pending'
										? 'Pending'
										: existing.quantity > 1
											? `${existing.quantity} in gym`
											: 'In gym'}
								</div>
							)}

							<div
								className={`absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full transition ${
									selected ? 'bg-accent scale-100' : 'bg-bg/80 ring-border ring-1 backdrop-blur-md'
								}`}
							>
								{selected && <Check className="text-bg h-3.5 w-3.5" strokeWidth={3} />}
							</div>
						</div>

						{/* Caption band: eyebrow, headline, meta */}
						<div className="bg-bg border-border/60 flex min-w-0 flex-1 flex-col border-t px-3.5 pb-3.5 pt-3">
							{eyebrow && <div className="text-sub truncate text-[11px] font-medium">{eyebrow}</div>}
							<div className="text-main mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight">
								{headline}
							</div>
							<div className="text-sub mt-auto pt-1.5 text-xs">
								{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}
							</div>
						</div>
>>>>>>> Stashed changes
					</button>
				</li>
			))}
		</ul>
	);

	const alreadyAtGym = stock && stock.length > 0 && (
		<div className="border-border flex flex-col gap-2 border-t pt-4">
			<span className="text-sub text-[11px] font-medium uppercase tracking-[0.08em]">
				Already at this gym · {stock.length}
			</span>
			<ul className="flex flex-col gap-1.5">
				{stock.slice(0, 6).map((e) => (
					<li key={e.equipment_id} className="text-sub flex justify-between gap-3 text-sm">
						<span className="truncate">{e.name}</span>
						<span className="shrink-0 text-xs tabular-nums">
							{e.status === 'pending' ? 'pending' : `×${e.quantity}`}
						</span>
					</li>
				))}
			</ul>
			{stock.length > 6 && <span className="text-sub text-xs">and {stock.length - 6} more</span>}
		</div>
	);

	return (
		<div className={cn('flex flex-col gap-6', selectedGym && 'pb-40 md:pb-8')}>
			{/* ── Step 1: gym ── */}
			{selectedGym ? (
				<div className="border-border flex items-center gap-3 rounded-[18px] border p-3 sm:gap-4 sm:p-4">
					<span className="hidden sm:contents">
						<StepBadge n={1} />
					</span>
					<GymThumb gym={selectedGym} size="md" />
					<div className="min-w-0 flex-1">
						<div className="text-main truncate text-lg font-semibold">{selectedGym.name}</div>
						<div className="text-sub flex items-center gap-1 truncate text-xs">
							{(selectedGym.city || selectedGym.country) && (
								<>
									<MapPin className="h-3 w-3 shrink-0" />
									{[selectedGym.city, selectedGym.country].filter(Boolean).join(', ')}
									{stock && ' · '}
								</>
							)}
							{stock && `${stock.length} machines listed`}
						</div>
					</div>
					<button
						type="button"
						onClick={() => {
							setSelectedGymId(null);
							setLocationWanted(true);
							requestAnimationFrame(() => gymInputRef.current?.focus());
						}}
						className="border-border text-main hover:bg-sub-alt h-10 shrink-0 rounded-full border px-4 text-sm transition-colors"
					>
						Change<span className="hidden sm:inline"> gym</span>
					</button>
				</div>
			) : (
				<section aria-labelledby="gym-step" className="flex flex-col gap-3">
					<div className="flex items-center gap-2.5">
						<StepBadge n={1} />
						<label id="gym-step" htmlFor="gym-search" className="text-main text-base font-semibold">
							Which gym?
						</label>
					</div>
					<div className="bg-surface focus-within:ring-accent flex h-12 scroll-mt-4 items-center gap-2.5 rounded-xl px-3.5 focus-within:ring-2">
						<Search className="text-sub h-4 w-4 shrink-0" />
						<input
							ref={gymInputRef}
							id="gym-search"
							type="search"
							value={gymQuery}
							onChange={(e) => setGymQuery(e.target.value)}
							onFocus={(e) => {
								setLocationWanted(true);
								// On phones, lift the field to the top so results fit above the keyboard.
								if (window.matchMedia('(max-width: 848px)').matches) {
									e.currentTarget.parentElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
								}
							}}
							placeholder="Search gyms by name or city"
							autoComplete="off"
							className="text-main placeholder:text-sub min-w-0 flex-1 bg-transparent text-[15px] outline-none"
						/>
						{gymQuery && (
							<button
								type="button"
								onClick={() => setGymQuery('')}
								aria-label="Clear search"
								className="bg-sub/40 text-bg flex h-5.5 w-5.5 items-center justify-center rounded-full"
							>
								<X className="h-3 w-3" />
							</button>
						)}
					</div>
					<div className="flex flex-col">
						<span className="text-sub px-1 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em]">
							{userLocation ? 'Nearest first' : gymQuery ? 'Matches' : 'Gyms'}
						</span>
						{filteredGyms.slice(0, GYM_RESULTS).map(({ gym: g, distance }) => (
							<button
								key={g.id}
								type="button"
								onClick={() => chooseGym(g.id)}
								className="hover:bg-surface border-border flex min-h-16 items-center gap-3 border-b px-1 text-left transition-colors last:border-b-0"
							>
								<GymThumb gym={g} size="sm" />
								<div className="min-w-0 flex-1">
									<div className="text-main truncate text-[15px] font-medium">{g.name}</div>
									<div className="text-sub truncate text-xs">
										{[
											[g.city, g.country].filter(Boolean).join(', '),
											distance !== null && formatDistance(distance),
											Number(g.total_equipment) > 0 && `${Number(g.total_equipment)} machines`
										]
											.filter(Boolean)
											.join(' · ') || '—'}
									</div>
								</div>
							</button>
						))}
						{filteredGyms.length > GYM_RESULTS && (
							<p className="text-sub px-1 pt-2 text-xs">
								Showing {GYM_RESULTS} of {filteredGyms.length}. Keep typing to narrow it down.
							</p>
						)}
						{gyms.length > 0 && filteredGyms.length === 0 && (
							<p className="text-sub px-1 py-4 text-sm">No gyms match “{gymQuery}”.</p>
						)}
						{gyms.length === 0 && (
							<p className="text-sub flex items-center gap-2 px-1 py-4 text-sm">
								<Loader2 className="h-4 w-4 animate-spin" /> Loading gyms…
							</p>
						)}
						<button
							type="button"
							onClick={onCreateGym}
							className="text-accent flex min-h-12 items-center gap-2 px-1 text-left text-sm"
						>
							<Plus className="h-4 w-4" />
							Not here? Add it as a new gym
						</button>
					</div>
				</section>
			)}

			{/* ── Step 2: machines + additions ── */}
			<div
				className={cn(
					'flex flex-col gap-6 lg:flex-row lg:items-start',
					!selectedGym && 'pointer-events-none opacity-40'
				)}
				aria-disabled={!selectedGym}
			>
				<section aria-labelledby="machine-step" className="flex min-w-0 flex-1 flex-col gap-3.5">
					<div className="flex items-center gap-2.5">
						<StepBadge n={2} />
						<label id="machine-step" htmlFor="machine-search" className="text-main text-base font-semibold">
							{selectedGym ? 'Find the machines' : 'Then find the machines'}
						</label>
					</div>

					<div className="flex gap-2.5">
						<div className="bg-surface focus-within:ring-accent flex h-12 min-w-0 flex-1 scroll-mt-4 items-center gap-2.5 rounded-xl px-3.5 focus-within:ring-2">
							<Search className="text-sub h-4 w-4 shrink-0" />
							<input
								ref={machineInputRef}
								id="machine-search"
								type="search"
								value={machineQuery}
								onChange={(e) => setMachineQuery(e.target.value)}
								onFocus={(e) => {
									if (window.matchMedia('(max-width: 848px)').matches) {
										e.currentTarget.parentElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
									}
								}}
								placeholder="Search by machine, brand or exercise"
								autoComplete="off"
								disabled={!selectedGym}
								className="text-main placeholder:text-sub min-w-0 flex-1 bg-transparent text-[15px] outline-none"
							/>
							{machineQuery && (
								<button
									type="button"
									onClick={() => setMachineQuery('')}
									aria-label="Clear search"
									className="bg-sub/40 text-bg flex h-5.5 w-5.5 items-center justify-center rounded-full"
								>
									<X className="h-3 w-3" />
								</button>
							)}
						</div>
						<label className="sr-only" htmlFor="brand-filter">
							Brand
						</label>
						<select
							id="brand-filter"
							value={brand}
							onChange={(e) => setBrand(e.target.value)}
							disabled={!selectedGym}
							className="border-border bg-bg text-main hidden h-12 max-w-44 rounded-xl border px-3 text-sm sm:block"
						>
							<option value="">Brand: Any</option>
							{brands.map((b) => (
								<option key={b} value={b}>
									{b}
								</option>
							))}
						</select>
					</div>

					{categories.length > 0 && (
						<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
							{[null, ...categories].map((c) => {
								const on = category === c;
								return (
									<button
										key={c ?? 'all'}
										type="button"
										aria-pressed={on}
										onClick={() => setCategory(c)}
										className={cn(
											'h-9 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors',
											on ? 'bg-main text-bg border-main' : 'border-border text-main hover:bg-surface'
										)}
									>
										{c ?? 'All'}
									</button>
								);
							})}
						</div>
					)}

					{/* Results: 2-up cards on phones, 3-up on wide screens. The add/added
					    state sits on the photo so it fits even at ~170px wide. */}
					<ul className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
						{shownEquipment.map((item) => {
							const selected = machines.some((m) => m.id === item.id);
							const existing = inGymMap.get(item.id);
							const tag = existing
								? existing.status === 'pending'
									? 'Pending'
									: existing.quantity > 1
										? `Listed ×${existing.quantity}`
										: 'Listed'
								: null;
							return (
								<li key={item.id}>
									<button
										type="button"
										onClick={() => toggleMachine(item.id)}
										aria-pressed={selected}
										aria-label={`${selected ? 'Remove' : 'Add'} ${equipLabel(item)}${tag ? ` (${tag.toLowerCase()})` : ''}`}
										className={cn(
											'bg-bg flex h-full w-full flex-col rounded-2xl border p-2 text-left transition-colors',
											selected ? 'border-accent' : 'border-border hover:border-sub/60'
										)}
									>
										<div className="relative">
											<MachinePhoto
												item={item}
												className="aspect-square w-full rounded-xl sm:aspect-auto sm:h-32 sm:rounded-[13px]"
												sizes="(max-width: 720px) 45vw, 260px"
											/>
											{tag && (
												<span className="bg-main/65 text-bg absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
													{tag}
												</span>
											)}
											<span
												className={cn(
													'absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full shadow-sm',
													selected ? 'bg-accent text-bg' : 'bg-bg text-main'
												)}
												aria-hidden="true"
											>
												{selected ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <Plus className="h-4 w-4" />}
											</span>
										</div>
										<div className="min-w-0 px-1 pb-0.5 pt-2">
											<div className="text-main line-clamp-2 text-sm font-medium leading-snug sm:text-[15px]">
												{item.name}
											</div>
											<div className="text-sub mt-0.5 truncate text-xs sm:text-[13px]">{brandLine(item) || '—'}</div>
										</div>
									</button>
								</li>
							);
						})}
					</ul>

					{filteredEquipment.length > MACHINE_RESULTS && (
						<p className="text-sub text-xs">
							Showing {MACHINE_RESULTS} of {filteredEquipment.length}. Search or filter to narrow it down.
						</p>
					)}
					{equipment.length > 0 && filteredEquipment.length === 0 && (
						<p className="text-sub py-2 text-sm">No machines match{machineQuery ? ` “${machineQuery}”` : ''}.</p>
					)}

					<button
						type="button"
						onClick={onCreateMachine}
						className="border-border text-sub hover:text-main flex min-h-13 items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed px-4 text-sm transition-colors"
					>
						{machineQuery ? `Can't find “${machineQuery}”?` : "Can't find the one you train on?"}
						<span className="text-accent font-medium">Create a new machine</span>
					</button>
				</section>

				{/* Additions (desktop sidebar) */}
				<aside
					aria-label="Your additions"
					className="bg-surface sticky top-4 hidden w-95 shrink-0 flex-col gap-3 rounded-[20px] p-5 lg:flex"
				>
					<div className="flex items-center justify-between">
						<span className="text-main text-base font-semibold">Your additions</span>
						<span className="bg-main text-bg flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
							{totalQty}
						</span>
					</div>
					{selectedMachines.length > 0 ? (
						additionsList(false)
					) : (
						<p className="text-sub py-3 text-sm">Tap machines on the left to add them here.</p>
					)}
					{alreadyAtGym}
				</aside>
			</div>

			{/* ── Action bar ──
			    Phones: fixed to the bottom; while the keyboard is up it becomes a slim
			    bar riding on top of it. md+: a floating bar above the footer pills. */}
			{selectedGym && (
				<div
					className="bg-bg/95 border-border fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:sticky md:bottom-16 md:rounded-2xl md:border md:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.3)]"
					style={keyboardOpen ? { transform: `translateY(-${keyboardInset}px)` } : undefined}
				>
					{keyboardOpen ? (
						<div className="flex h-13 items-center justify-between px-4">
							<button
								type="button"
								onClick={() => {
									(document.activeElement as HTMLElement | null)?.blur();
									setReviewOpen(true);
								}}
								disabled={totalQty === 0}
								className="text-main flex items-center gap-2 text-sm disabled:opacity-50"
							>
								<span className="bg-accent text-bg flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
									{totalQty}
								</span>
								added · Review
							</button>
							<button
								type="button"
								onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
								className="bg-main text-bg h-9 rounded-full px-4 text-sm font-medium"
							>
								Done
							</button>
						</div>
					) : (
						<div className="flex flex-col gap-2.5 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-5 md:py-3.5">
							{/* Phone/tablet: open the review sheet */}
							<button
								type="button"
								onClick={() => setReviewOpen(true)}
								disabled={totalQty === 0}
								className="text-main flex h-9 items-center justify-between text-sm disabled:opacity-50 lg:hidden"
							>
								<span className="flex items-center gap-2">
									<span className="bg-main text-bg flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums">
										{totalQty}
									</span>
									Your additions
								</span>
								<span className="text-sub ml-4 flex items-center gap-1">
									Review <ChevronUp className="h-3.5 w-3.5" />
								</span>
							</button>
							<p className="text-sub hidden items-center gap-2 text-sm lg:flex">
								<ShieldCheck className="text-accent h-4.5 w-4.5 shrink-0" />
								Reviewed by an admin before it goes live.
							</p>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!canSubmit || isSubmitting}
								className={cn(
									'flex h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-medium transition disabled:cursor-not-allowed',
									justAdded ? 'bg-accent text-bg' : canSubmit ? 'bg-main text-bg hover:opacity-90' : 'bg-sub-alt text-sub'
								)}
							>
								{ctaIcon}
								<span className="md:hidden">{canSubmit || justAdded || isSubmitting ? ctaShort : ctaLabel}</span>
								<span className="hidden truncate md:inline">{ctaLabel}</span>
							</button>
						</div>
					)}
				</div>
			)}

			{/* ── Review sheet (below lg) ── */}
			{reviewOpen && (
				<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="review-title">
					<button
						type="button"
						aria-label="Close"
						onClick={() => setReviewOpen(false)}
						className="absolute inset-0 bg-black/40"
					/>
					<div className="bg-bg absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col gap-3.5 rounded-t-3xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2.5">
						<span className="bg-border h-1.5 w-10 self-center rounded-full" />
						<div className="flex items-end justify-between">
							<div>
								<h2 id="review-title" className="text-main text-xl font-semibold">
									Your additions
								</h2>
								<p className="text-sub text-sm">to {selectedGym?.name}</p>
							</div>
							<button
								type="button"
								onClick={() => {
									setReviewOpen(false);
									requestAnimationFrame(() => machineInputRef.current?.focus());
								}}
								className="text-accent h-11 text-sm"
							>
								Add more
							</button>
						</div>
						<div className="min-h-0 overflow-y-auto">
							{selectedMachines.length > 0 ? (
								additionsList(true)
							) : (
								<p className="text-sub py-4 text-sm">Nothing added yet.</p>
							)}
						</div>
						<p className="text-sub flex items-center gap-2 text-[13px]">
							<ShieldCheck className="text-accent h-4 w-4 shrink-0" />
							Reviewed by an admin before it goes live
						</p>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!canSubmit || isSubmitting}
							className={cn(
								'flex h-14 items-center justify-center gap-2 rounded-full text-base font-medium transition disabled:cursor-not-allowed',
								canSubmit ? 'bg-main text-bg' : 'bg-sub-alt text-sub'
							)}
						>
							{ctaIcon}
							{canSubmit || isSubmitting || justAdded ? ctaShort : ctaLabel}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
