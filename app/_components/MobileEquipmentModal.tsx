'use client';
import { useEffect, useState } from 'react';
import { Dumbbell, Search, X } from 'lucide-react';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import type { Equipment } from '@/types/equipment';
import { API_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

export function MobileEquipmentModal({ onClose }: { onClose: () => void }) {
	const { selectedEquipment, setSelectedEquipment, searchByEquipment } = useGymFilter();
	const [query, setQuery] = useState('');
	const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetch(`${API_URL}/equipment`)
			.then((r) => r.json())
			.then((data) => setAllEquipment(data.data ?? data))
			.catch(() => {});
	}, []);

	const results = query.trim()
		? allEquipment
				.filter((e) =>
					`${e.brand} ${e.series} ${e.name}`.toLowerCase().includes(query.toLowerCase())
				)
				.slice(0, 15)
		: allEquipment.slice(0, 20);

	const toggle = (item: Equipment) => {
		const exists = selectedEquipment.some((e) => e.id === item.id);
		setSelectedEquipment(
			exists ? selectedEquipment.filter((e) => e.id !== item.id) : [...selectedEquipment, item]
		);
	};

	const handleSearch = async () => {
		setLoading(true);
		await searchByEquipment(selectedEquipment);
		setLoading(false);
		onClose();
	};

	return (
		<div className="z-100 fixed inset-0 flex flex-col bg-bg md:hidden">
			{/* Search input header */}
			<div className="flex shrink-0 items-center gap-3 border-b border-sub-alt px-4 py-3">
				<Search size={16} className="shrink-0 text-sub" />
				<input
					autoFocus
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search machines..."
					className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-sub"
					style={{ caretColor: 'var(--caret-color)' }}
				/>
				<button onClick={onClose} className="shrink-0 text-sub">
					<X size={18} />
				</button>
			</div>

			{/* Equipment list */}
			<div className="min-h-0 flex-1 overflow-y-auto">
				{results.map((item) => {
					const isSelected = selectedEquipment.some((e) => e.id === item.id);
					return (
						<div
							key={item.id}
							onClick={() => toggle(item)}
							className={cn(
								'hover:bg-white/4 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
								isSelected && 'bg-white/4'
							)}
						>
							<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-sub-alt">
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
								<p className="truncate text-[13px] text-text">
									{item.brand} {item.name}
								</p>
								<p className="mt-0.5 text-[11px] text-sub">{item.series}</p>
							</div>
							{isSelected && (
								<div className="bg-main/20 flex h-5 w-5 shrink-0 items-center justify-center rounded">
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="var(--main-color)"
										strokeWidth="3"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Footer — search button */}
			{selectedEquipment.length > 0 && (
				<div className="shrink-0 border-t border-sub-alt px-4 py-3">
					<button
						onClick={handleSearch}
						disabled={loading}
						className="bg-main/20 text-main hover:bg-main/30 w-full rounded-lg py-2.5 text-[13px] font-medium transition disabled:opacity-50"
					>
						{loading
							? 'Searching...'
							: `Search ${selectedEquipment.length} machine${selectedEquipment.length > 1 ? 's' : ''}`}
					</button>
				</div>
			)}
		</div>
	);
}
