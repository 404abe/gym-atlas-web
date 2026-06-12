'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { matchesSearch } from '@/lib/utils';
import { Loader2, X, Search, Dumbbell, Check } from 'lucide-react';
import { GymEquipment } from '@/types/gym';
import { Equipment } from '@/types/equipment';
import { addGymEquipment } from '@/lib/api';
import { useToastContext } from '@/app/contexts/ToastContext';
import { useAuth } from '@/app/contexts/AuthContext';

type Props = {
	gymId: number;
	masterEquipment: Equipment[];
	onEquipmentAdded: (newEquipment: GymEquipment) => void;
	onClose: () => void;
};

export default function AddEquipmentPanel({
	gymId,
	masterEquipment,
	onEquipmentAdded,
	onClose
}: Props) {
	const { addToast } = useToastContext();
	const { user } = useAuth();
	const [query, setQuery] = useState('');
	const [adding, setAdding] = useState<number | null>(null);
	const [justAdded, setJustAdded] = useState<number | null>(null);
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

	return (
		<div className="border-border bg-sub-alt mb-3 mt-2 rounded-xl border p-3">
			{/* Search */}
			<div className="relative mb-3">
				<Search className="text-sub pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search equipment…"
					className="bg-surface border-border text-main placeholder:text-sub focus:border-main/40 h-9 w-full rounded-lg border pl-8 pr-8 text-xs outline-none transition"
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

							return (
								<div
									key={item.id}
									className="border-border bg-surface flex items-center gap-3 rounded-xl border p-2.5"
								>
									{/* Thumbnail */}
									<div className="bg-sub-alt border-border h-14 w-14 shrink-0 overflow-hidden rounded-lg border">
										{item.image_url ? (
											<img
												src={item.image_url}
												alt={item.name}
												className="h-full w-full object-cover"
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
										<span className="text-sub bg-main/8 mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]">
											{item.type === 'pin_loaded' ? 'pin loaded' : 'plate loaded'}
										</span>
									</div>

									{/* Add button */}
									<button
										onClick={() => handleAdd(item)}
										disabled={!!adding || isDone}
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
											isDone
												? 'border border-green-500/30 text-green-500'
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
