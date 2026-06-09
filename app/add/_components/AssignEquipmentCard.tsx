'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Building2, Dumbbell, MapPin, X, Plus, Loader2 } from 'lucide-react';
import { useToastContext } from '@/app/contexts/ToastContext';
import { addGymEquipment } from '@/lib/api';
import type { Gym } from '@/types/gym';
import type { Equipment } from '@/types/equipment';

type Props = {
	gyms: Gym[];
	equipment: Equipment[];
	preselectedEquipmentId?: number;
};

export default function AssignEquipmentCard({ gyms, equipment, preselectedEquipmentId }: Props) {
	const { addToast } = useToastContext();
	const { user } = useAuth();
	const [selectedGym, setSelectedGym] = useState<number | null>(null);
	const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [gymSearch, setGymSearch] = useState('');
	const [equipSearch, setEquipSearch] = useState('');
	const [showGymDropdown, setShowGymDropdown] = useState(false);
	const [showEquipDropdown, setShowEquipDropdown] = useState(false);
	const [isAdding, setIsAdding] = useState(false);

	const gymRef = useRef<HTMLDivElement>(null);
	const equipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (!gymRef.current?.contains(e.target as Node)) setShowGymDropdown(false);
			if (!equipRef.current?.contains(e.target as Node)) setShowEquipDropdown(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	useEffect(() => {
		if (!preselectedEquipmentId || equipment.length === 0) return;
		const match = equipment.find((e) => e.id === preselectedEquipmentId);
		if (match) {
			setSelectedEquipment(match.id);
			setEquipSearch([match.brand, match.series, match.name].filter(Boolean).join(' '));
		}
	}, [preselectedEquipmentId, equipment]);

	const filteredGyms = useMemo(
		() => gyms.filter((g) => g?.name?.toLowerCase().includes(gymSearch.toLowerCase())),
		[gyms, gymSearch]
	);

	const filteredEquipment = useMemo(
		() =>
			equipment.filter((e) =>
				`${e.brand} ${e.series} ${e.name}`.toLowerCase().includes(equipSearch.toLowerCase())
			),
		[equipment, equipSearch]
	);

	const equipLabel = (e: Equipment) => [e.brand, e.series, e.name].filter(Boolean).join(' ');

	const handleAdd = async () => {
		if (!selectedGym || !selectedEquipment) return;
		setIsAdding(true);
		try {
			await addGymEquipment(selectedGym, selectedEquipment, quantity);
			const gymName = gyms.find((g) => g.id === selectedGym)?.name;
			const eqName = equipment.find((e) => e.id === selectedEquipment);
			const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

			addToast(
				isAdmin
					? `Added ${eqName?.brand} ${eqName?.name} ×${quantity} to ${gymName}`
					: `Suggested ${eqName?.brand} ${eqName?.name} ×${quantity} for ${gymName} — pending review`,
				'success'
			);
			setSelectedGym(null);
			setSelectedEquipment(null);
			setQuantity(1);
			setGymSearch('');
			setEquipSearch('');
		} catch {
			addToast('Failed to add equipment to gym', 'error');
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<div className="bg-sub-alt rounded-2xl p-5">
			<div className="mb-5 flex items-center gap-3">
				<div className="bg-main flex h-8 w-8 items-center justify-center rounded-lg">
					<Building2 className="text-bg h-4 w-4" />
				</div>
				<div>
					<h2 className="text-main text-sm font-semibold">Assign to gym</h2>
					<p className="text-sub text-xs">Add equipment to an existing gym</p>
				</div>
			</div>

			<div className="space-y-3">
				{/* Gym selector */}
				<div ref={gymRef} className="relative">
					<label className="text-sub mb-1 block text-xs">Gym</label>
					<div className="relative">
						<MapPin className="text-sub absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
						<input
							type="text"
							value={gymSearch}
							onChange={(e) => {
								setGymSearch(e.target.value);
								setShowGymDropdown(true);
							}}
							onFocus={() => setShowGymDropdown(true)}
							placeholder="Search gym..."
							className="bg-main/5 border-main/10 text-main placeholder:text-sub focus:border-main/30 h-9 w-full rounded-lg border pl-9 pr-8 text-sm outline-none"
						/>
						{gymSearch && (
							<button
								onClick={() => {
									setGymSearch('');
									setSelectedGym(null);
								}}
								className="absolute right-2.5 top-1/2 -translate-y-1/2"
								aria-label="Clear gym"
							>
								<X className="text-sub h-3.5 w-3.5" />
							</button>
						)}
					</div>
					{showGymDropdown && gymSearch && filteredGyms.length > 0 && (
						<div className="bg-sub-alt border-main/10 absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border shadow-lg">
							{filteredGyms.slice(0, 6).map((gym) => (
								<button
									key={gym.id}
									onClick={() => {
										setSelectedGym(gym.id);
										setGymSearch(gym.name);
										setShowGymDropdown(false);
									}}
									className="hover:bg-main/5 flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
								>
									<Building2 className="text-sub h-3 w-3 shrink-0" />
									<span className="text-main">{gym.name}</span>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Equipment selector */}
				<div ref={equipRef} className="relative">
					<label className="text-sub mb-1 block text-xs">Equipment</label>
					<div className="relative">
						<Dumbbell className="text-sub absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
						<input
							type="text"
							value={equipSearch}
							onChange={(e) => {
								setEquipSearch(e.target.value);
								setShowEquipDropdown(true);
							}}
							onFocus={() => setShowEquipDropdown(true)}
							placeholder="Search equipment..."
							className="bg-main/5 border-main/10 text-main placeholder:text-sub focus:border-main/30 h-9 w-full rounded-lg border pl-9 pr-8 text-sm outline-none"
						/>
						{equipSearch && (
							<button
								onClick={() => {
									setEquipSearch('');
									setSelectedEquipment(null);
								}}
								className="absolute right-2.5 top-1/2 -translate-y-1/2"
								aria-label="Clear equipment"
							>
								<X className="text-sub h-3.5 w-3.5" />
							</button>
						)}
					</div>
					{showEquipDropdown && equipSearch && filteredEquipment.length > 0 && (
						<div className="bg-sub-alt border-main/10 absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border shadow-lg">
							{filteredEquipment.slice(0, 6).map((item) => (
								<button
									key={item.id}
									onClick={() => {
										setSelectedEquipment(item.id);
										setEquipSearch(equipLabel(item));
										setShowEquipDropdown(false);
									}}
									className="hover:bg-main/5 w-full px-3 py-2 text-left"
								>
									<p className="text-main text-sm">{equipLabel(item)}</p>
									<p className="text-sub text-xs">{item.type?.replace('_', ' ') ?? '—'}</p>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Quantity */}
				<div>
					<label className="text-sub mb-1 block text-xs">Quantity</label>
					<input
						type="number"
						min={1}
						value={quantity}
						onChange={(e) => setQuantity(Number(e.target.value))}
						className="bg-main/5 border-main/10 text-main focus:border-main/30 h-9 w-full rounded-lg border px-3 text-sm outline-none"
					/>
				</div>

				<button
					onClick={handleAdd}
					disabled={!selectedGym || !selectedEquipment || isAdding}
					className="bg-main text-bg mt-1 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
					{isAdding ? 'Adding...' : 'Add to gym'}
				</button>
			</div>
		</div>
	);
}
