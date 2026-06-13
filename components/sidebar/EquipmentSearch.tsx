'use client';

import { Search, X, Dumbbell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { API_URL } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import type { Equipment } from '@/types/equipment';

const pillCls =
	'flex items-center bg-surface border-[0.5px] border-border rounded-lg backdrop-blur pointer-events-auto';

export default function EquipmentSearch() {
	const {
		setFilteredGyms,
		filteredGyms,
		selectedEquipment,
		setSelectedEquipment,
		searchByEquipment
	} = useGymFilter();
	const [expanded, setExpanded] = useState(false);
	const [query, setQuery] = useState('');
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const selectedEquipmentRef = useRef(selectedEquipment);
	selectedEquipmentRef.current = selectedEquipment;

	const hasResults = filteredGyms !== null;

	useEffect(() => {
		fetch(`${API_URL}/equipment`)
			.then((r) => r.json())
			.then((data) => setEquipment(data.data ?? data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!expanded) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') collapse();
		};
		const onMouseDown = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) collapse();
		};
		document.addEventListener('keydown', onKey);
		document.addEventListener('mousedown', onMouseDown);
		return () => {
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('mousedown', onMouseDown);
		};
	}, [expanded]);

	const collapse = () => {
		setExpanded(false);
		setQuery('');
		if (selectedEquipmentRef.current.length === 0) setFilteredGyms(null);
	};

	const open = () => {
		setExpanded(true);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const toggleEquipment = (item: Equipment) => {
		const exists = selectedEquipment.some((e) => e.id === item.id);
		const next = exists
			? selectedEquipment.filter((e) => e.id !== item.id)
			: [...selectedEquipment, item];
		setSelectedEquipment(next);
		searchByEquipment(next);
	};

	const results = query.trim()
		? equipment
				.filter((e) => {
					const full = `${e.brand} ${e.series} ${e.name}`.toLowerCase();
					const words = query.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
					return words.every((w) => full.includes(w));
				})
				.slice(0, 8)
		: [];

	return (
		<div
			ref={containerRef}
			className="pointer-events-auto relative"
			style={
				{
					'--search-width': '280px',
					'--search-gap': '6px',
					'--results-max-height': '360px',
					'--chip-size': '40px',
					perspective: 'none'
				} as React.CSSProperties
			}
		>
			{/* ── Expanded pill input ── */}
			{expanded ? (
				<div
					className={cn(pillCls, 'flex h-[var(--hit-size)] items-center gap-2 px-3')}
					style={{ width: 'var(--search-width)' }}
				>
					<Search size={16} className="text-sub shrink-0" />
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') collapse();
						}}
						placeholder="Search machines..."
						className="text-text flex-1 border-none bg-transparent text-[13px] outline-none"
						style={{ caretColor: 'var(--caret-color)' }}
					/>
					{selectedEquipment.length > 0 && (
						<span className="text-sub bg-surface mr-1 rounded-[var(--roundness)] px-[5px] py-px text-[10px]">
							{selectedEquipment.length}
						</span>
					)}
					{query && (
						<Button variant="ghost" onClick={() => setQuery('')} className="shrink-0 p-0">
							<X size={14} />
						</Button>
					)}
				</div>
			) : (
				/* ── Collapsed pill button ── */
				<Button
					variant="pill"
					onClick={open}
					style={{ color: hasResults ? 'var(--text-color)' : 'var(--sub-color)' }}
				>
					<Search size={16} />
					<span className="text-[12px] tracking-[0.04em]">
						{hasResults ? `${filteredGyms!.length} gyms` : 'Filter by machine'}
					</span>
					{selectedEquipment.length > 0 && (
						<span className="text-sub bg-surface rounded-[var(--roundness)] px-[5px] py-px text-[10px]">
							{selectedEquipment.length}
						</span>
					)}
				</Button>
			)}

			{expanded && (
				<>
					{/* ── Results dropdown ── */}
					{results.length > 0 && (
						<div
							className={cn(
								pillCls,
								'z-200 absolute left-0 top-full flex flex-col overflow-y-auto py-1'
							)}
							style={{
								width: 'var(--search-width)',
								maxHeight: 'var(--results-max-height)',
								marginTop: 'var(--search-gap)',
								transform: 'none'
							}}
						>
							{results.map((item) => {
								const isSelected = selectedEquipment.some((e) => e.id === item.id);
								return (
									<div
										key={item.id}
										onClick={() => toggleEquipment(item)}
										className={cn(
											'flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-text/4',
											isSelected && 'bg-text/4'
										)}
									>
										<div
											className="bg-sub-alt flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--roundness)]"
											style={{ width: 'var(--chip-size)', height: 'var(--chip-size)' }}
										>
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
											<p className="text-text m-0 truncate text-[13px]">
												{item.brand} {item.name}
											</p>
											<p className="text-sub m-0 mt-0.5 text-[11px]">{item.series}</p>
										</div>
										{isSelected && (
											<div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[var(--roundness)] bg-text/10">
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="var(--text-color)"
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
					)}


					{/* ── Selected chips panel (desktop only) ── */}
					{/* {selectedEquipment.length > 0 && (
						<div
							className="z-200 max-h-100 bg-surface absolute left-full top-0 flex flex-col gap-2 overflow-y-auto"
							style={{
								width: 'calc(var(--search-width) - 20px)',
								marginLeft: '8px'
							}}
						>
							{selectedEquipment.map((item) => (
								<div
									key={item.id}
									className="flex items-center gap-2 rounded-[var(--roundness)] bg-text/6 p-1.5"
								>
									<div
										className="bg-sub-alt flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--roundness)]"
										style={{ width: '32px', height: '32px' }}
									>
										{item.image_url ? (
											<img
												src={item.image_url}
												alt={item.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<Dumbbell size={14} className="text-sub" />
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-text m-0 truncate text-[11px]">
											{item.brand} {item.name}
										</p>
										<p className="text-sub m-0 mt-0.5 text-[9px]">{item.series}</p>
									</div>
									<Button onClick={() => toggleEquipment(item)} className="shrink-0 p-0">
										<X size={12} />
									</Button>
								</div>
							))}
						</div>
					)} */}
				</>
			)}
		</div>
	);
}
