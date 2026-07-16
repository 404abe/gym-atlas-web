'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { filterId, type ActiveFilter, type FilterKind } from '@/lib/gym-filter';

interface GymFilterContextValue {
	/** Which tab is showing: exercises (broad) or machines (specific). */
	tab: FilterKind;
	/** Switching tabs clears the current filters. */
	setTab: (tab: FilterKind) => void;
	/** All selected filters (any mix of exercises and machines). */
	activeFilters: ActiveFilter[];
	/**
	 * Ids of gyms matching *every* active filter — the pins to highlight. `null`
	 * means "nothing selected / not yet resolved" → every pin renders normally.
	 */
	matchedGymIds: Set<number> | null;
	/** True while any selected filter is still resolving its gyms. */
	loading: boolean;
	/**
	 * Add a filter, or remove it if it's already selected (toggle). `machineNames`
	 * is the set of machine names that satisfy the filter — one name for a
	 * specific machine, or every machine mapping to an exercise. Matching gyms are
	 * resolved from these without touching the rendered pin set.
	 */
	toggleFilter: (filter: ActiveFilter, machineNames: string[]) => void;
	/** Same as toggleFilter, but resolves gyms by brand id instead of machine names. */
	toggleBrandFilter: (filter: ActiveFilter, brandId: number) => void;
	/** Remove a single filter (e.g. dismissing its card). */
	removeFilter: (filter: ActiveFilter) => void;
	/** Remove every filter. */
	clearFilters: () => void;
}

const GymFilterContext = createContext<GymFilterContextValue>({
	tab: 'exercises',
	setTab: () => {},
	activeFilters: [],
	matchedGymIds: null,
	loading: false,
	toggleFilter: () => {},
	toggleBrandFilter: () => {},
	removeFilter: () => {},
	clearFilters: () => {}
});

/** Gyms whose machine names contain `name` (single-term POST /gyms/search). */
async function gymIdsForMachine(name: string): Promise<number[]> {
	try {
		const res = await fetch(`${API_URL}/gyms/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ machines: [name] })
		});
		const data = await res.json();
		const gyms = Array.isArray(data) ? data : (data.data ?? []);
		return gyms.map((g: { id: number }) => Number(g.id)).filter((id: number) => Number.isFinite(id));
	} catch {
		return [];
	}
}

/** Gyms with any equipment from the given brand (POST /gyms/search). */
async function gymIdsForBrand(brandId: number): Promise<number[]> {
	try {
		const res = await fetch(`${API_URL}/gyms/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ brand_id: brandId })
		});
		const data = await res.json();
		const gyms = Array.isArray(data) ? data : (data.data ?? []);
		return gyms.map((g: { id: number }) => Number(g.id)).filter((id: number) => Number.isFinite(id));
	} catch {
		return [];
	}
}

export function GymFilterProvider({ children }: { children: React.ReactNode }) {
	const [tab, setTabState] = useState<FilterKind>('exercises');
	const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
	// Resolved gym ids per filter, keyed by filterId(). Absent while resolving.
	const [gymSets, setGymSets] = useState<Record<string, Set<number>>>({});
	// filterIds still awaiting their /gyms/search results.
	const [pending, setPending] = useState<string[]>([]);
	// Per-filter token so a slow (or removed) filter's response can't apply late.
	const tokens = useRef<Record<string, number>>({});

	const removeFilter = useCallback((filter: ActiveFilter) => {
		const id = filterId(filter);
		tokens.current[id] = (tokens.current[id] ?? 0) + 1; // invalidate any in-flight
		setActiveFilters((prev) => prev.filter((f) => filterId(f) !== id));
		setGymSets((prev) => {
			if (!(id in prev)) return prev;
			const next = { ...prev };
			delete next[id];
			return next;
		});
		setPending((prev) => prev.filter((p) => p !== id));
	}, []);

	const clearFilters = useCallback(() => {
		for (const key of Object.keys(tokens.current)) {
			tokens.current[key] = (tokens.current[key] ?? 0) + 1;
		}
		setActiveFilters([]);
		setGymSets({});
		setPending([]);
	}, []);

	const setTab = useCallback(
		(next: FilterKind) => {
			setTabState(next);
			clearFilters();
		},
		[clearFilters]
	);

	// Shared by toggleFilter and toggleBrandFilter — only how gym ids are resolved differs.
	const runToggle = useCallback(
		(filter: ActiveFilter, resolve: () => Promise<number[]>) => {
			const id = filterId(filter);
			if (activeFilters.some((f) => filterId(f) === id)) {
				removeFilter(filter);
				return;
			}

			const token = (tokens.current[id] = (tokens.current[id] ?? 0) + 1);
			setActiveFilters((prev) => [...prev, filter]);
			setPending((prev) => [...prev, id]);

			void resolve().then((ids) => {
				if (token !== tokens.current[id]) return; // stale or removed
				setGymSets((prev) => ({ ...prev, [id]: new Set(ids) }));
				setPending((prev) => prev.filter((p) => p !== id));
			});
		},
		[activeFilters, removeFilter]
	);

	const toggleFilter = useCallback(
		(filter: ActiveFilter, machineNames: string[]) =>
			runToggle(filter, async () => {
				const lists = await Promise.all(machineNames.map(gymIdsForMachine));
				const ids = new Set<number>();
				for (const list of lists) for (const gymId of list) ids.add(gymId);
				return [...ids];
			}),
		[runToggle]
	);

	const toggleBrandFilter = useCallback(
		(filter: ActiveFilter, brandId: number) => runToggle(filter, () => gymIdsForBrand(brandId)),
		[runToggle]
	);

	// Highlight gyms matching EVERY resolved filter (intersection). Filters still
	// resolving don't constrain yet; they tighten the set once their gyms arrive.
	const matchedGymIds = useMemo(() => {
		if (activeFilters.length === 0) return null;
		const sets = activeFilters
			.map((f) => gymSets[filterId(f)])
			.filter((s): s is Set<number> => Boolean(s));
		if (sets.length === 0) return null;
		let result: Set<number> | null = null;
		for (const set of sets) {
			if (result === null) {
				result = new Set(set);
				continue;
			}
			const intersection = new Set<number>();
			result.forEach((id) => {
				if (set.has(id)) intersection.add(id);
			});
			result = intersection;
		}
		return result;
	}, [activeFilters, gymSets]);

	const value = useMemo(
		() => ({
			tab,
			setTab,
			activeFilters,
			matchedGymIds,
			loading: pending.length > 0,
			toggleFilter,
			toggleBrandFilter,
			removeFilter,
			clearFilters
		}),
		[
			tab,
			setTab,
			activeFilters,
			matchedGymIds,
			pending,
			toggleFilter,
			toggleBrandFilter,
			removeFilter,
			clearFilters
		]
	);

	return <GymFilterContext.Provider value={value}>{children}</GymFilterContext.Provider>;
}

export const useGymFilter = () => useContext(GymFilterContext);
