// Predicts the most likely exercise for a machine name by matching against the
// known exercise list. Used to pre-fill the primary exercise picker; the user can
// always override it.

// Filler words common in machine names that shouldn't drive a match on their own.
const STOPWORDS = new Set([
	'seated', 'standing', 'lying', 'machine', 'cable', 'plate', 'loaded',
	'pin', 'pin-loaded', 'selectorized', 'assisted', 'incline', 'decline'
]);

const words = (str: string) =>
	str
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length > 0);

export function predictExercise(
	machineName: string,
	exercises: { id: string; name: string }[]
): { id: string; name: string } | null {
	const query = machineName.trim().toLowerCase();
	if (query.length < 3 || exercises.length === 0) return null;

	const queryWords = new Set(words(query));

	let best: { ex: { id: string; name: string }; score: number } | null = null;
	for (const ex of exercises) {
		const exName = ex.name.toLowerCase();
		let score = 0;

		if (query.includes(exName)) {
			// Full exercise name appears in the machine name — strongest signal.
			// Longer matches win (e.g. "Incline Chest Press" over "Chest Press").
			score = 1000 + exName.length;
		} else {
			// Otherwise score on meaningful shared words.
			const overlap = words(exName).filter(
				(w) => !STOPWORDS.has(w) && queryWords.has(w)
			).length;
			if (overlap > 0) score = overlap;
		}

		if (score > 0 && (!best || score > best.score)) best = { ex, score };
	}

	return best ? best.ex : null;
}
