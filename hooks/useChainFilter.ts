import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
	CHAIN_FILTER_STORAGE_KEY,
	DEFAULT_CHAIN_FILTER,
	parseChainFilter,
	toggleHiddenChain,
	type ChainFilterState
} from '@/lib/chain-filter';

// The filter lives in localStorage and is read through useSyncExternalStore, so
// the server render and hydration both see the default and the stored value takes
// over afterwards without a setState in an effect. `override` holds the latest
// write in memory, which keeps the filter working when storage throws (private
// mode, blocked storage, quota) and is dropped on reload like any module state.
let override: string | null | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot(): string | null {
	if (override !== undefined) return override;
	try {
		return localStorage.getItem(CHAIN_FILTER_STORAGE_KEY);
	} catch {
		return null;
	}
}

const getServerSnapshot = () => null;

function write(next: ChainFilterState) {
	const raw = JSON.stringify(next);
	override = raw;
	try {
		localStorage.setItem(CHAIN_FILTER_STORAGE_KEY, raw);
	} catch {
		// Not persisted, still applied for this visit.
	}
	listeners.forEach((listener) => listener());
}

export function useChainFilter() {
	const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const state = useMemo(() => parseChainFilter(raw), [raw]);

	const setIndependentOnly = useCallback((independentOnly: boolean) => {
		write({ ...parseChainFilter(getSnapshot()), independentOnly });
	}, []);

	const toggleChain = useCallback((slug: string) => {
		write(toggleHiddenChain(parseChainFilter(getSnapshot()), slug));
	}, []);

	const reset = useCallback(() => write(DEFAULT_CHAIN_FILTER), []);

	return { state, setIndependentOnly, toggleChain, reset };
}
