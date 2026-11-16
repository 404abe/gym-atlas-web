// Chain vs independent filtering for the map and gym list. Pure functions only,
// so the rules can be tested without React, the DOM or the map.
//
// A gym is "independent" when it has no chain. Two controls feed the filter:
//   independentOnly   hides every chain gym (the master switch)
//   hiddenChainSlugs  hides specific chains and keeps the rest
// independentOnly wins while it is on, but it never clears hiddenChainSlugs, so
// switching it back off restores the user's per-chain choices.

export interface ChainFilterState {
	independentOnly: boolean;
	hiddenChainSlugs: string[];
}

export const DEFAULT_CHAIN_FILTER: ChainFilterState = {
	independentOnly: false,
	hiddenChainSlugs: []
};

export const CHAIN_FILTER_STORAGE_KEY = 'gym_chain_filter';

type WithChain = { chain?: { slug: string } | null };

export function isChainFilterActive(state: ChainFilterState): boolean {
	return state.independentOnly || state.hiddenChainSlugs.length > 0;
}

/** How many separate things the user has switched on, for the control's badge. */
export function chainFilterCount(state: ChainFilterState): number {
	return state.independentOnly ? 1 : state.hiddenChainSlugs.length;
}

/**
 * Applies the filter. Returns the input array itself when nothing is active, so
 * callers that key caches on array identity (the map's clustering) keep their hits.
 */
export function applyChainFilter<T extends WithChain>(gyms: T[], state: ChainFilterState): T[] {
	if (!isChainFilterActive(state)) return gyms;
	if (state.independentOnly) return gyms.filter((gym) => !gym.chain);
	const hidden = new Set(state.hiddenChainSlugs);
	return gyms.filter((gym) => !gym.chain || !hidden.has(gym.chain.slug));
}

export function toggleHiddenChain(state: ChainFilterState, slug: string): ChainFilterState {
	const hidden = state.hiddenChainSlugs.includes(slug)
		? state.hiddenChainSlugs.filter((value) => value !== slug)
		: [...state.hiddenChainSlugs, slug];
	return { ...state, hiddenChainSlugs: hidden };
}

/** Reads a persisted value defensively; anything malformed falls back to the default. */
export function parseChainFilter(raw: string | null): ChainFilterState {
	if (!raw) return DEFAULT_CHAIN_FILTER;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null) return DEFAULT_CHAIN_FILTER;
		const { independentOnly, hiddenChainSlugs } = value as Record<string, unknown>;
		return {
			independentOnly: independentOnly === true,
			hiddenChainSlugs: Array.isArray(hiddenChainSlugs)
				? hiddenChainSlugs.filter((slug): slug is string => typeof slug === 'string')
				: []
		};
	} catch {
		return DEFAULT_CHAIN_FILTER;
	}
}
