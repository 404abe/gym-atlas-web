'use client';

import { Dumbbell, MapPin, Search, Tag } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn, matchesSearch } from '@/lib/utils';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import {
	machineFullName,
	machineLabel,
	machinesForExercise,
	popularBrands,
	popularExercises,
	popularMachines
} from '@/lib/gym-filter';
import { useEquipmentCatalog } from '@/hooks/useEquipmentCatalog';
import type { Gym } from '@/types/gym';
import type { Equipment, ExerciseRef } from '@/types/equipment';
import type { Brand } from '@/lib/api';

type Row =
	| { kind: 'gym'; gym: Gym }
	| { kind: 'exercise'; exercise: ExerciseRef }
	| { kind: 'machine'; machine: Equipment }
	| { kind: 'brand'; brand: Brand };

const PER_GROUP = 5;
// A few default suggestions per group, shown before the user types anything.
const SUGGEST_COUNT = 4;

/** Viewport-relative box (from getBoundingClientRect) to expand the palette from. */
export type PaletteAnchor = { left: number; top: number; width: number };

export default function CommandPalette({
	gyms,
	onSelectGym,
	onClose,
	initialQuery = '',
	anchor
}: {
	gyms: Gym[];
	onSelectGym: (gym: Gym) => void;
	onClose: () => void;
	/** Seeds the input — used when the search trigger forwards a keystroke. */
	initialQuery?: string;
	/** When set, the panel expands in place from this box instead of centering. */
	anchor?: PaletteAnchor;
}) {
	const { toggleFilter, toggleBrandFilter } = useGymFilter();
	const { equipment, exercises, brands } = useEquipmentCatalog();
	const [query, setQuery] = useState(initialQuery);
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;
		input.focus();
		// Put the caret after any seeded text rather than selecting it.
		input.setSelectionRange(input.value.length, input.value.length);
	}, []);

	// Empty query shows default suggestions so the dropdown is populated the
	// moment the palette opens; typing switches each group to search matches.
	const trimmed = query.trim();
	const gymResults = useMemo(
		() =>
			trimmed
				? gyms.filter((g) => matchesSearch(query, g.name, g.city)).slice(0, PER_GROUP)
				: gyms.slice(0, SUGGEST_COUNT),
		[trimmed, query, gyms]
	);
	const exerciseResults = useMemo(
		() =>
			trimmed
				? exercises.filter((e) => matchesSearch(query, e.name)).slice(0, PER_GROUP)
				: popularExercises(equipment, exercises, SUGGEST_COUNT),
		[trimmed, query, exercises, equipment]
	);
	const machineResults = useMemo(
		() =>
			trimmed
				? equipment
						.filter((m) => matchesSearch(query, m.brand, m.series, m.name))
						.slice(0, PER_GROUP)
				: popularMachines(equipment, SUGGEST_COUNT),
		[trimmed, query, equipment]
	);
	const brandResults = useMemo(
		() =>
			trimmed
				? brands.filter((b) => matchesSearch(query, b.name)).slice(0, PER_GROUP)
				: popularBrands(brands, SUGGEST_COUNT),
		[trimmed, query, brands]
	);

	// Every visible row, in display order, so arrow keys can move through the
	// whole palette regardless of which group a row is in.
	const rows: Row[] = useMemo(
		() => [
			...gymResults.map((gym): Row => ({ kind: 'gym', gym })),
			...exerciseResults.map((exercise): Row => ({ kind: 'exercise', exercise })),
			...machineResults.map((machine): Row => ({ kind: 'machine', machine })),
			...brandResults.map((brand): Row => ({ kind: 'brand', brand }))
		],
		[gymResults, exerciseResults, machineResults, brandResults]
	);

	const activate = (row: Row) => {
		if (row.kind === 'gym') {
			onSelectGym(row.gym);
		} else if (row.kind === 'exercise') {
			const names = machinesForExercise(row.exercise, equipment, exercises).map(machineFullName);
			toggleFilter(
				{ kind: 'exercises', key: row.exercise.id, name: row.exercise.name, subtitle: 'Exercise' },
				names
			);
		} else if (row.kind === 'machine') {
			toggleFilter(
				{
					kind: 'machines',
					key: row.machine.slug,
					name: machineLabel(row.machine),
					imageUrl: row.machine.image_url,
					subtitle: row.machine.series
				},
				[machineFullName(row.machine)]
			);
		} else {
			toggleBrandFilter(
				{
					kind: 'brands',
					key: String(row.brand.id),
					name: row.brand.name,
					imageUrl: row.brand.logo_url,
					subtitle: 'Brand'
				},
				row.brand.id
			);
		}
		onClose();
	};

	// Anchored: sit exactly where the trigger is (same left/top/width) and grow
	// downward, so it reads as the trigger expanding. Otherwise center near the top.
	const panelClass = anchor
		? 'fixed origin-top'
		: 'fixed left-1/2 top-[15vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2';
	const panelStyle = anchor
		? { left: anchor.left, top: anchor.top, width: anchor.width }
		: undefined;

	const hasBelow = rows.length > 0 || (trimmed && rows.length === 0);

	return (
		<div className="fixed inset-0 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div
				className={cn(
					panelClass,
					// Solid, opaque box (same tokens as the trigger pill) so it reads as a
					// crisp panel — not the washed-out, map-bleeding look of a translucent one.
					'border-border bg-bg overflow-hidden rounded-2xl border shadow-lg'
				)}
				style={panelStyle}
			>
				<div
					className={cn(
						'flex h-[52px] items-center gap-2.5 px-4',
						hasBelow && 'border-border border-b'
					)}
				>
					<Search size={17} className="text-sub shrink-0" />
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setActiveIndex(0);
						}}
						onKeyDown={(e) => {
							if (e.key === 'Escape') onClose();
							else if (e.key === 'ArrowDown') {
								e.preventDefault();
								setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
							} else if (e.key === 'ArrowUp') {
								e.preventDefault();
								setActiveIndex((i) => Math.max(i - 1, 0));
							} else if (e.key === 'Enter' && rows[activeIndex]) {
								e.preventDefault();
								activate(rows[activeIndex]);
							}
						}}
						placeholder="Search gyms, exercises, machines, or brands…"
						className="text-text placeholder:text-sub min-w-0 flex-1 bg-transparent text-[13px] outline-none"
					/>
				</div>

				{trimmed && rows.length === 0 && (
					<p className="text-sub px-4 py-6 text-center text-sm">
						No matches for &ldquo;{trimmed}&rdquo;
					</p>
				)}

				{rows.length > 0 && (
					<div className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
						<ResultGroup label="Gyms">
							{gymResults.map((gym, i) => (
								<Row
									key={`gym-${gym.id}`}
									active={activeIndex === i}
									icon={
										gym.image_url ? (
											<Image src={gym.image_url} alt="" fill sizes="32px" className="object-cover" />
										) : (
											<MapPin size={14} />
										)
									}
									title={gym.name}
									subtitle={gym.city}
									onClick={() => activate({ kind: 'gym', gym })}
								/>
							))}
						</ResultGroup>
						<ResultGroup label="Exercises">
							{exerciseResults.map((exercise, i) => (
								<Row
									key={`exercise-${exercise.id}`}
									active={activeIndex === gymResults.length + i}
									icon={<Dumbbell size={14} />}
									title={exercise.name}
									onClick={() => activate({ kind: 'exercise', exercise })}
								/>
							))}
						</ResultGroup>
						<ResultGroup label="Machines">
							{machineResults.map((machine, i) => (
								<Row
									key={`machine-${machine.id}`}
									active={activeIndex === gymResults.length + exerciseResults.length + i}
									icon={
										machine.image_url ? (
											<Image
												src={machine.image_url}
												alt=""
												fill
												sizes="32px"
												className="object-cover"
											/>
										) : (
											<Dumbbell size={14} />
										)
									}
									title={`${machine.brand} ${machine.name}`}
									subtitle={machine.series}
									onClick={() => activate({ kind: 'machine', machine })}
								/>
							))}
						</ResultGroup>
						<ResultGroup label="Brands">
							{brandResults.map((brand, i) => (
								<Row
									key={`brand-${brand.id}`}
									active={
										activeIndex ===
										gymResults.length + exerciseResults.length + machineResults.length + i
									}
									icon={
										brand.logo_url ? (
											<Image src={brand.logo_url} alt="" fill sizes="32px" className="object-cover" />
										) : (
											<Tag size={14} />
										)
									}
									title={brand.name}
									subtitle={`${brand.equipment_count} machine${brand.equipment_count === 1 ? '' : 's'}`}
									onClick={() => activate({ kind: 'brand', brand })}
								/>
							))}
						</ResultGroup>
					</div>
				)}
			</div>
		</div>
	);
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
	if (!Array.isArray(children) || children.length === 0) return null;
	return (
		<div>
			<p className="text-sub px-4 pb-1 pt-2 text-[11px] uppercase tracking-wide">{label}</p>
			{children}
		</div>
	);
}

function Row({
	active,
	icon,
	title,
	subtitle,
	onClick
}: {
	active: boolean;
	icon: React.ReactNode;
	title: string;
	subtitle?: string | null;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors',
				active ? 'bg-text/5' : 'hover:bg-text/5'
			)}
		>
			<span className="bg-sub-alt text-sub relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg">
				{icon}
			</span>
			<span className="min-w-0 flex-1">
				<span className="text-text block truncate text-[13px]">{title}</span>
				{subtitle && <span className="text-sub block truncate text-[11px]">{subtitle}</span>}
			</span>
		</button>
	);
}
