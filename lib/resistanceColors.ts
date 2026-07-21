// Canonical color per resistance-profile type, shared across every place that
// visualizes a curve (picker buttons, mini profile chip, new-machine form,
// custom curve editor) so the same profile always reads as the same color.
export const RESISTANCE_COLORS = {
	constant: '#6b7280',
	ascending: '#22c55e',
	descending: '#ef4444',
	adjustable: '#3b82f6',
	custom: '#a78bfa'
} as const;
