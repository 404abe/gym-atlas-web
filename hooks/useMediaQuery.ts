import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query. Returns `null` on the server and during
 * hydration, then the real match, so callers can hold off mounting anything
 * expensive until they know which layout they're in.
 */
export function useMediaQuery(query: string): boolean | null {
	return useSyncExternalStore(
		(onChange) => {
			const mql = window.matchMedia(query);
			mql.addEventListener('change', onChange);
			return () => mql.removeEventListener('change', onChange);
		},
		() => window.matchMedia(query).matches,
		() => null
	);
}

/** Matches Tailwind's custom `md` breakpoint (849px), where the desktop layout starts. */
export const DESKTOP_QUERY = '(min-width: 849px)';
