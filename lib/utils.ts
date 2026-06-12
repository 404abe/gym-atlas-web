export function cn(...classes: (string | undefined | false | null)[]): string {
	return classes.filter(Boolean).join(' ');
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
	if (!query.trim()) return true;
	const words = query.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
	const full = fields.map((f) => f ?? '').join(' ').toLowerCase();
	return words.every((w) => full.includes(w));
}
