'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { matchesSearch } from '@/lib/utils';
import { useAuth } from '@/app/contexts/AuthContext';
import { Building2, Dumbbell, MapPin, Minus, Plus, Check, Loader2, ArrowLeftRight } from 'lucide-react';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';
import { addGymEquipment } from '@/lib/api';
import BottomSheet from '@/components/ui/BottomSheet';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';

type Props = {
	gyms: Gym[];
	equipment: Equipment[];
	preselectedEquipmentId?: number;
};

type SelectedMachine = { id: number; qty: number };

const equipLabel = (e: Equipment) => [e.brand, e.series, e.name].filter(Boolean).join(' ');

export default function AssignEquipmentCard({ gyms, equipment, preselectedEquipmentId }: Props) {
	const { addToast } = useToastContext();
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();

	const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
	const [machines, setMachines] = useState<SelectedMachine[]>([]);
	const [sheet, setSheet] = useState<'none' | 'gym' | 'machine'>('none');
	const [gymQuery, setGymQuery] = useState('');
	const [machineQuery, setMachineQuery] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [justAdded, setJustAdded] = useState(false);
	const [preselectApplied, setPreselectApplied] = useState(false);

	useEffect(() => {
		if (preselectApplied || !preselectedEquipmentId || equipment.length === 0) return;
		const match = equipment.find((e) => e.id === preselectedEquipmentId);
		if (match) setMachines((prev) => (prev.some((m) => m.id === match.id) ? prev : [...prev, { id: match.id, qty: 1 }]));
		setPreselectApplied(true);
	}, [preselectApplied, preselectedEquipmentId, equipment]);

	const selectedGym = gyms.find((g) => g.id === selectedGymId) ?? null;

	const filteredGyms = gyms.filter((g) => matchesSearch(gymQuery, g.name, g.city, g.country));
	const filteredEquipment = equipment.filter((e) => matchesSearch(machineQuery, e.brand, e.series, e.name));

	const selectedMachines = machines
		.map((m) => {
			const item = equipment.find((e) => e.id === m.id);
			return item ? { ...item, qty: m.qty } : null;
		})
		.filter((m): m is Equipment & { qty: number } => m !== null);

	const toggleMachine = (id: number) => {
		setMachines((prev) =>
			prev.some((m) => m.id === id) ? prev.filter((m) => m.id !== id) : [...prev, { id, qty: 1 }]
		);
	};

	const adjustQty = (id: number, delta: number) => {
		setMachines((prev) =>
			prev.map((m) => (m.id === id ? { ...m, qty: Math.max(1, m.qty + delta) } : m))
		);
	};

	const removeMachine = (id: number) => setMachines((prev) => prev.filter((m) => m.id !== id));

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
				selectedMachines.length === 1
					? equipLabel(selectedMachines[0])
					: `${selectedMachines.length} machines`;
			addToast(
				isAdmin
					? `Added ${summary} to ${gymName}`
					: `Suggested ${summary} for ${gymName} — pending review`,
				'success'
			);
			setJustAdded(true);
			setTimeout(() => {
				setJustAdded(false);
				setSelectedGymId(null);
				setMachines([]);
			}, 1500);
		} catch {
			addToast('Failed to assign equipment to gym', 'error');
		} finally {
			setIsSubmitting(false);
		}
	};

	const ctaLabel = justAdded
		? 'Added to gym'
		: !canSubmit
			? 'Add to gym'
			: totalQty > 1
				? `Add ${totalQty} machines to gym`
				: 'Add to gym';
	const ctaHint = !selectedGym
		? 'Select a gym to continue'
		: selectedMachines.length === 0
			? 'Add at least one machine'
			: '';

	return (
		<div className="flex flex-col gap-3">
			{/* Gym box */}
			<button
				type="button"
				onClick={() => setSheet('gym')}
				className="bg-surface flex w-full items-center rounded-[22px] p-[18px] text-left shadow-sm transition hover:opacity-90"
			>
				{selectedGym ? (
					<div className="flex w-full items-center gap-3.5">
						<div className="bg-main text-bg relative flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold">
							{selectedGym.image_url ? (
								<Image src={selectedGym.image_url} alt={selectedGym.name} fill sizes="52px" className="object-cover" />
							) : (
								selectedGym.name.slice(0, 1).toUpperCase()
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="text-accent mb-0.5 text-xs font-semibold uppercase tracking-wide">
								Selected gym
							</div>
							<div className="text-main truncate text-[17px] font-semibold leading-tight">
								{selectedGym.name}
							</div>
							{(selectedGym.city || selectedGym.country) && (
								<div className="text-sub mt-0.5 flex items-center gap-1 text-sm">
									<MapPin className="h-3 w-3 shrink-0" />
									{[selectedGym.city, selectedGym.country].filter(Boolean).join(', ')}
								</div>
							)}
						</div>
						<span className="bg-sub-alt text-sub shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium">
							Change
						</span>
					</div>
				) : (
					<div className="flex w-full flex-col items-center gap-2.5 py-1">
						<div className="bg-sub-alt flex h-13 w-13 items-center justify-center rounded-2xl">
							<Building2 className="text-main h-6 w-6" />
						</div>
						<div className="text-center">
							<div className="text-main text-base font-semibold">Select a gym</div>
							<div className="text-sub mt-0.5 text-xs">Tap to search all gyms</div>
						</div>
					</div>
				)}
			</button>

			{/* Connector */}
			<div className="flex h-8 items-center justify-center">
				<div className="bg-surface flex h-7 w-7 items-center justify-center rounded-full shadow">
					<ArrowLeftRight className="text-sub h-3.5 w-3.5 rotate-90" />
				</div>
			</div>

			{/* Machine box */}
			<div className="bg-surface w-full rounded-[22px] p-[18px] shadow-sm">
				{selectedMachines.length > 0 ? (
					<div>
						<div className="mb-3 flex items-center justify-between">
							<span className="text-accent text-xs font-semibold uppercase tracking-wide">
								Equipment · {selectedMachines.length}
							</span>
							<button
								type="button"
								onClick={() => setSheet('machine')}
								className="text-accent flex items-center gap-1 text-sm font-semibold"
							>
								<Plus className="h-3.5 w-3.5" />
								Add more
							</button>
						</div>
						<div className="grid grid-cols-2 gap-2.5">
							{selectedMachines.map((m) => (
								<div key={m.id} className="bg-sub-alt border-border relative rounded-2xl border p-2.5">
									<button
										type="button"
										onClick={() => removeMachine(m.id)}
										aria-label={`Remove ${m.name}`}
										className="bg-main/60 absolute right-1.5 top-1.5 z-10 flex h-5.5 w-5.5 items-center justify-center rounded-full text-bg backdrop-blur-sm"
									>
										<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
											<path d="M18 6 6 18M6 6l12 12" />
										</svg>
									</button>
									{m.qty > 1 && (
										<div className="bg-main/60 text-bg absolute left-1.5 top-1.5 z-10 rounded-md px-1.5 py-0.5 text-[11px] font-bold backdrop-blur-sm">
											×{m.qty}
										</div>
									)}
									<div className="bg-main/5 relative flex h-23 items-center justify-center overflow-hidden rounded-xl">
										{m.image_url ? (
											<Image src={m.image_url} alt={m.name} fill sizes="140px" className="object-contain p-1.5" />
										) : (
											<Dumbbell className="text-sub h-8 w-8 opacity-30" />
										)}
									</div>
									<div className="mt-2 flex items-center justify-between gap-1.5">
										<div className="text-main min-w-0 flex-1 truncate text-[13px] font-semibold">
											{m.name}
										</div>
										<div className="flex shrink-0 items-center gap-0.5">
											<button
												type="button"
												onClick={() => adjustQty(m.id, -1)}
												aria-label={`Decrease ${m.name} quantity`}
												className="text-sub hover:text-main flex h-5 w-5 items-center justify-center"
											>
												<Minus className="h-3 w-3" />
											</button>
											<span className="text-sub min-w-3 text-center text-xs font-semibold">
												{m.qty}
											</span>
											<button
												type="button"
												onClick={() => adjustQty(m.id, 1)}
												aria-label={`Increase ${m.name} quantity`}
												className="text-sub hover:text-main flex h-5 w-5 items-center justify-center"
											>
												<Plus className="h-3 w-3" />
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setSheet('machine')}
						className="flex w-full flex-col items-center gap-2.5 py-1"
					>
						<div className="bg-sub-alt flex h-13 w-13 items-center justify-center rounded-2xl">
							<Dumbbell className="text-main h-6 w-6" />
						</div>
						<div className="text-center">
							<div className="text-main text-base font-semibold">Add equipment</div>
							<div className="text-sub mt-0.5 text-xs">Assign one or more machines</div>
						</div>
					</button>
				)}
			</div>

			{/* CTA */}
			<button
				type="button"
				onClick={handleSubmit}
				disabled={!canSubmit || isSubmitting}
				className={`mt-1 flex h-13.5 w-full items-center justify-center gap-2 rounded-2xl text-[16.5px] font-semibold transition disabled:cursor-not-allowed ${
					justAdded
						? 'bg-accent text-bg'
						: canSubmit
							? 'bg-main text-bg shadow-lg hover:opacity-90'
							: 'bg-sub-alt text-sub'
				}`}
			>
				{isSubmitting ? (
					<Loader2 className="h-4.5 w-4.5 animate-spin" />
				) : justAdded ? (
					<Check className="h-5 w-5" />
				) : (
					<Plus className="h-4.5 w-4.5" />
				)}
				{isSubmitting ? 'Adding...' : ctaLabel}
			</button>
			{ctaHint && <p className="text-sub text-center text-xs">{ctaHint}</p>}

			{/* Gym picker sheet */}
			<BottomSheet
				open={sheet === 'gym'}
				onClose={() => setSheet('none')}
				title="Select gym"
				search={gymQuery}
				onSearchChange={setGymQuery}
				searchPlaceholder="Search gyms..."
			>
				{filteredGyms.map((g) => {
					const selected = g.id === selectedGymId;
					return (
						<button
							key={g.id}
							type="button"
							onClick={() => {
								setSelectedGymId(g.id);
								setSheet('none');
								setGymQuery('');
							}}
							className="hover:bg-main/5 flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition"
						>
							<div className="bg-main text-bg relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold">
								{g.image_url ? (
									<Image src={g.image_url} alt={g.name} fill sizes="40px" className="object-cover" />
								) : (
									g.name.slice(0, 1).toUpperCase()
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-main truncate text-[15px] font-semibold">{g.name}</div>
								<div className="text-sub text-xs">{[g.city, g.country].filter(Boolean).join(', ') || '—'}</div>
							</div>
							{selected && (
								<div className="bg-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
									<Check className="text-bg h-3.5 w-3.5" strokeWidth={3} />
								</div>
							)}
						</button>
					);
				})}
				{filteredGyms.length === 0 && (
					<p className="text-sub py-8 text-center text-sm">No gyms found</p>
				)}
			</BottomSheet>

			{/* Machine picker sheet */}
			<BottomSheet
				open={sheet === 'machine'}
				onClose={() => setSheet('none')}
				title="Add equipment"
				search={machineQuery}
				onSearchChange={setMachineQuery}
				searchPlaceholder="Search machines..."
				footer={
					<button
						type="button"
						onClick={() => setSheet('none')}
						className={`flex h-12.5 w-full items-center justify-center rounded-xl text-[15px] font-semibold transition ${
							machines.length > 0 ? 'bg-main text-bg' : 'bg-sub-alt text-sub'
						}`}
					>
						{machines.length > 0 ? `Done · ${machines.length} selected` : 'Done'}
					</button>
				}
			>
				{filteredEquipment.map((item) => {
					const selected = machines.some((m) => m.id === item.id);
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => toggleMachine(item.id)}
							className="hover:bg-main/5 flex w-full items-center gap-3.5 rounded-2xl p-2.5 text-left transition"
						>
							<div className="bg-sub-alt relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
								{item.image_url ? (
									<Image src={item.image_url} alt={item.name} fill sizes="40px" className="object-cover" />
								) : (
									<Dumbbell className="text-sub h-4.5 w-4.5" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-main truncate text-[15px] font-semibold">{equipLabel(item)}</div>
								<div className="text-sub text-xs">{item.type === 'pin_loaded' ? 'Pin loaded' : 'Plate loaded'}</div>
							</div>
							<div
								className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
									selected ? 'bg-accent' : 'border-border border-2'
								}`}
							>
								{selected && <Check className="text-bg h-3.5 w-3.5" strokeWidth={3} />}
							</div>
						</button>
					);
				})}
				{filteredEquipment.length === 0 && (
					<p className="text-sub py-8 text-center text-sm">No equipment found</p>
				)}
			</BottomSheet>
		</div>
	);
}
