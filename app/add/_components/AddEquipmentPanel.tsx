'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { matchesSearch } from '@/lib/utils';
import { Loader2, X, Search, Dumbbell, Check } from 'lucide-react';
import { GymEquipment } from '@/types/gym';
import { Equipment } from '@/types/equipment';
import { addGymEquipment } from '@/lib/api';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAuthGate } from '@/app/contexts/AuthGateContext';

type Props = {
	gymId: number;
	masterEquipment: Equipment[];
	existingEquipment: GymEquipment[];
	onEquipmentAdded: (newEquipment: GymEquipment) => void;
	onClose: () => void;
};

export default function AddEquipmentPanel({
	gymId,
	masterEquipment,
	existingEquipment,
	onEquipmentAdded,
	onClose
}: Props) {
	const existingMap = useMemo(
		() => new Map(existingEquipment.map((e) => [e.equipment_id, e.quantity])),
		[existingEquipment]
	);
	const { addToast } = useToastContext();
	const { user } = useAuth();
	const { requireAuth } = useAuthGate();
	const [query, setQuery] = useState('');
	const [adding, setAdding] = useState<number | null>(null);
	const [justAdded, setJustAdded] = useState<number | null>(null);
	const [confirmItem, setConfirmItem] = useState<Equipment | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const t = setTimeout(() => inputRef.current?.focus(), 50);
		return () => clearTimeout(t);
	}, []);

	const filtered = useMemo(
		() => masterEquipment.filter((e) => matchesSearch(query, e.brand, e.series, e.name)).slice(0, 8),
		[masterEquipment, query]
	);

	const handleAdd = async (item: Equipment) => {
		if (adding !== null) return;
		if (!requireAuth('add equipment to a gym')) return;
		setConfirmItem(null);
		setAdding(item.id);
		try {
			await addGymEquipment(gymId, item.id, 1);
			const isSuperAdmin = user?.role === 'super_admin';
			onEquipmentAdded({
				equipment_id: item.id,
				brand: item.brand,
				series: item.series,
				name: item.name,
				full_name: [item.brand, item.series, item.name].filter(Boolean).join(' '),
				quantity: 1,
				image_url: item.image_url,
				status: isSuperAdmin ? 'approved' : 'pending'
			});
			setJustAdded(item.id);
			setTimeout(() => setJustAdded(null), 1500);
			addToast(
				isSuperAdmin
					? `${item.brand} ${item.name} added successfully`
					: `${item.brand} ${item.name} submitted for review`,
				'success'
			);
		} catch (err) {
			console.error('Failed to add equipment:', err);
			addToast('Failed to add equipment', 'error');
		} finally {
			setAdding(null);
		}
	};

	const handleAddClick = (item: Equipment) => {
		if (existingMap.has(item.id)) {
			setConfirmItem(item);
		} else {
			handleAdd(item);
		}
	};

	return (
		<div className="bg-sub-alt mb-3 mt-2 rounded-xl p-3">
			{/* Search */}
			<div className="relative mb-3">
				<Search className="text-sub pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search equipment…"
					className="bg-surface text-main placeholder:text-sub h-9 w-full rounded-lg pl-8 pr-8 text-xs outline-none transition"
					autoComplete="off"
				/>
				{query && (
					<button
						onClick={() => setQuery('')}
						className="text-sub hover:text-main absolute right-2.5 top-1/2 -translate-y-1/2"
						aria-label="Clear search"
					>
						<X className="h-3 w-3" />
					</button>
				)}
			</div>

			{/* Results */}
			{query && (
				<div className="flex flex-col gap-2">
					{filtered.length === 0 ? (
						<p className="text-sub py-4 text-center text-xs">No equipment found</p>
					) : (
						filtered.map((item) => {
							const isAdding = adding === item.id;
							const isDone = justAdded === item.id;
							const existingQty = existingMap.get(item.id);
							const inGym = existingQty !== undefined;
							const isConfirming = confirmItem?.id === item.id;

							return (
								<div key={item.id} className="flex flex-col gap-0 overflow-hidden rounded-xl">
									<div className="bg-surface flex items-center gap-3 p-2.5">
										{/* Thumbnail */}
										<div className="bg-sub-alt h-14 w-14 shrink-0 overflow-hidden rounded-lg">
											{item.image_url ? (
												<Image
													src={item.image_url}
													alt={item.name}
													fill
													sizes="56px"
													className="object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center">
													<Dumbbell className="text-sub h-5 w-5 opacity-30" />
												</div>
											)}
										</div>

										{/* Info */}
										<div className="min-w-0 flex-1">
											<p className="text-main truncate text-sm font-medium">
												{item.brand} {item.name}
											</p>
											<p className="text-sub mt-0.5 text-xs">{item.series}</p>
											<div className="mt-1 flex flex-wrap gap-1">
												<span className="text-sub bg-main/8 inline-block rounded px-1.5 py-0.5 text-[10px]">
													{item.type === 'pin_loaded' ? 'pin loaded' : 'plate loaded'}
												</span>
												{inGym && (
													<span className="inline-block rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
														in gym
													</span>
												)}
											</div>
										</div>

										{/* Add button */}
										<button
											onClick={() => handleAddClick(item)}
											disabled={!!adding || isDone || isConfirming}
											className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
												isDone
													? 'border border-green-500/30 text-green-500'
													: inGym
														? 'border border-main/20 text-sub hover:border-main/40 hover:text-main disabled:opacity-40'
														: 'bg-main text-bg hover:opacity-80 disabled:opacity-40'
											}`}
											aria-label={`Add ${item.name}`}
										>
											{isAdding ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : isDone ? (
												<Check className="h-3.5 w-3.5" />
											) : (
												<span className="text-xs font-medium">+</span>
											)}
										</button>
									</div>

									{/* Duplicate confirmation */}
									{isConfirming && (
										<div className="border-border bg-surface flex items-center justify-between gap-3 border-t px-3 py-2.5">
											<p className="text-sub text-xs">
												There{existingQty === 1 ? "'s" : ' are'} already{' '}
												<span className="text-main font-medium">{existingQty}</span> of this in
												the gym. Add another?
											</p>
											<div className="flex shrink-0 gap-1.5">
												<button
													onClick={() => setConfirmItem(null)}
													className="border-border text-sub hover:text-main rounded-lg border px-2.5 py-1 text-xs transition"
												>
													Cancel
												</button>
												<button
													onClick={() => handleAdd(item)}
													className="bg-main text-bg hover:opacity-80 rounded-lg px-2.5 py-1 text-xs transition"
												>
													Add
												</button>
											</div>
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			)}

			{/* Empty state — no query yet */}
			{!query && (
				<p className="text-sub py-2 text-center text-xs">Type to search the equipment catalogue</p>
			)}

			{/* Cancel */}
			<div className="mt-3 flex justify-end">
				<button onClick={onClose} className="text-sub hover:text-main text-xs transition">
					Cancel
				</button>
			</div>
		</div>
	);
}
