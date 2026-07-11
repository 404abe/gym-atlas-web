'use client';

import { Check, Dumbbell, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { fetchMachineExercises } from '@/lib/api';
import { cn, matchesSearch } from '@/lib/utils';
import { useGymFilter } from '@/app/contexts/GymFilterContext';
import { machineFullName, machineLabel, machinesForExercise, type FilterKind } from '@/lib/gym-filter';
import type { Equipment, ExerciseRef } from '@/types/equipment';

const ACCENT = '#3ee7a6';

const TABS: { value: FilterKind; label: string }[] = [
	{ value: 'exercises', label: 'Exercises' },
	{ value: 'machines', label: 'Machines' }
];

/** `gymCount` is the number of gyms matching the current filter (all gyms when none). */
export default function GymFinderSearch({ gymCount }: { gymCount: number }) {
	const { tab, setTab, activeFilters, toggleFilter } = useGymFilter();

	const [query, setQuery] = useState('');
	// The results list is opened by typing/focusing and only closed by an explicit
	// dismiss (outside tap, clearing the field, or "Show N gyms") — never by picking
	// a row, so several machines can be toggled in one pass.
	const [open, setOpen] = useState(false);
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [exercises, setExercises] = useState<ExerciseRef[]>([]);
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetch(`${API_URL}/equipment`)
			.then((r) => r.json())
			.then((data) => setEquipment(data.data ?? data ?? []))
			.catch(() => {});
		fetchMachineExercises()
			.then(setExercises)
			.catch(() => {});
	}, []);

	// Close the list on an outside tap or Escape.
	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	// Switching tabs clears the field and the filter, and closes the list.
	const switchTab = (next: FilterKind) => {
		if (next === tab) return;
		setQuery('');
		setOpen(false);
		setTab(next);
	};

	const clearSearch = () => {
		setQuery('');
		setOpen(false);
	};

	// ── Toggling a filter (multi-select) — never closes the list ──
	const selectExercise = (exercise: ExerciseRef) => {
		const names = machinesForExercise(exercise, equipment, exercises).map(machineFullName);
		toggleFilter(
			{ kind: 'exercises', key: exercise.id, name: exercise.name, subtitle: 'Exercise' },
			names
		);
	};
	const selectMachine = (machine: Equipment) => {
		toggleFilter(
			{
				kind: 'machines',
				key: machine.slug,
				name: machineLabel(machine),
				imageUrl: machine.image_url,
				subtitle: machine.series
			},
			[machineFullName(machine)]
		);
	};

	const isActive = (kind: FilterKind, key: string) =>
		activeFilters.some((f) => f.kind === kind && f.key === key);

	// ── Typed results ──
	const trimmed = query.trim();
	const exerciseResults = useMemo(
		() =>
			tab === 'exercises' && trimmed
				? exercises.filter((e) => matchesSearch(query, e.name)).slice(0, 8)
				: [],
		[tab, trimmed, query, exercises]
	);
	const machineResults = useMemo(
		() =>
			tab === 'machines' && trimmed
				? equipment.filter((m) => matchesSearch(query, m.brand, m.series, m.name)).slice(0, 8)
				: [],
		[tab, trimmed, query, equipment]
	);
	const hasResults = exerciseResults.length > 0 || machineResults.length > 0;
	const showList = open && trimmed !== '' && hasResults;

	const submitTop = () => {
		if (tab === 'exercises' && exerciseResults[0]) selectExercise(exerciseResults[0]);
		else if (tab === 'machines' && machineResults[0]) selectMachine(machineResults[0]);
	};

	return (
		<div
			ref={panelRef}
			className="pointer-events-auto w-full rounded-2xl border border-border bg-bg/92 p-2.5 shadow-lg backdrop-blur-sm md:w-[340px]"
		>
			{/* ── Segmented tabs ── */}
			<div className="mb-2.5 flex rounded-xl bg-sub-alt p-0.5">
				{TABS.map(({ value, label }) => (
					<button
						key={value}
						type="button"
						onClick={() => switchTab(value)}
						className={cn(
							'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
							tab === value ? 'bg-surface text-main shadow-sm' : 'text-sub hover:text-main'
						)}
					>
						{label}
					</button>
				))}
			</div>

			{/* ── Pill search input ── */}
			<div className="relative">
				<div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface pl-4 pr-1.5">
					<input
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') submitTop();
							if (e.key === 'Escape') clearSearch();
						}}
						placeholder={
							tab === 'exercises'
								? 'Search exercises, e.g. T-bar Row'
								: 'Search machines, e.g. Prime Arm Curl'
						}
						className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-sub"
						style={{ caretColor: 'var(--caret-color)' }}
					/>
					{query && (
						<button
							type="button"
							onClick={clearSearch}
							className="shrink-0 text-sub transition hover:text-main"
							aria-label="Clear search"
						>
							<X size={15} />
						</button>
					)}
					<button
						type="button"
						onClick={submitTop}
						disabled={!hasResults}
						aria-label="Apply top match"
						className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-black transition disabled:opacity-40"
						style={{ background: ACCENT }}
					>
						<Search size={15} className="stroke-[2.5]" />
					</button>
				</div>

				{/* ── Typed results dropdown ── */}
				{showList && (
					<div className="absolute left-0 right-0 top-full z-30 mt-1.5 flex max-h-[min(60vh,420px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
						<div className="min-h-0 flex-1 overflow-y-auto py-1">
							{exerciseResults.map((exercise) => (
								<button
									key={exercise.id}
									type="button"
									onClick={() => selectExercise(exercise)}
									className={cn(
										'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-text/5',
										isActive('exercises', exercise.id) && 'bg-text/5'
									)}
								>
									<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sub-alt text-sub">
										<Dumbbell size={14} />
									</span>
									<span className="min-w-0 flex-1 truncate text-[13px] text-text">
										{exercise.name}
									</span>
									{isActive('exercises', exercise.id) && <SelectedTick />}
								</button>
							))}
							{machineResults.map((machine) => (
								<button
									key={machine.id}
									type="button"
									onClick={() => selectMachine(machine)}
									className={cn(
										'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-text/5',
										isActive('machines', machine.slug) && 'bg-text/5'
									)}
								>
									<span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-sub-alt text-sub">
										{machine.image_url ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={machine.image_url}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											<Dumbbell size={14} />
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[13px] text-text">
											{machine.brand} {machine.name}
										</span>
										{machine.series && (
											<span className="block truncate text-[11px] text-sub">
												{machine.series}
											</span>
										)}
									</span>
									{isActive('machines', machine.slug) && <SelectedTick />}
								</button>
							))}
						</div>

						{/* Apply + dismiss: the list is filtered live, so this just reveals the map. */}
						<div className="shrink-0 border-t border-border p-2">
							<button
								type="button"
								onClick={() => setOpen(false)}
								className="w-full rounded-full py-2 text-[13px] font-medium text-black transition hover:opacity-90"
								style={{ background: ACCENT }}
							>
								Show {gymCount} gym{gymCount === 1 ? '' : 's'}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

/** Green check shown on an already-selected result row. */
function SelectedTick() {
	return (
		<span
			className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-black"
			style={{ background: ACCENT }}
		>
			<Check size={13} className="stroke-3" />
		</span>
	);
}
