// Brand logos we ship locally for well-known gym chains, matched on gym name.
// Used wherever a gym has no photo of its own (landing carousel, contribute page).

const CHAIN_LOGOS: { pattern: RegExp; src: string }[] = [
	{ pattern: /pure\s?gym/i, src: '/landing/puregym-logo.png' }
];

export function logoForGym(name: string): string | null {
	return CHAIN_LOGOS.find(({ pattern }) => pattern.test(name))?.src ?? null;
}
